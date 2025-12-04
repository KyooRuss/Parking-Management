// Admin dashboard backed by Firebase Realtime Database.
// Mirrors the layout from the HTML/CSS you provided and connects to:
//   https://silagan-crud-default-rtdb.firebaseio.com/parking-management

document.addEventListener('DOMContentLoaded', () => {
  // Default total slots per vehicle type. Can be overridden from Firebase settings.
  let motorcycleTotal = 21;
  let carTotal = 21;

  // --- Firebase init (compat SDK, globals from script tags in HTML) ---
  const firebaseConfig = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    databaseURL: 'https://silagan-crud-default-rtdb.firebaseio.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.database();

  // Core state (derived from RTDB)
  let slotStatus = {}; // { A1: true/false }
  let PARKED_DATA_BY_SLOT = {}; // { A1: { category, contact, plate, user, timeIn } }
  let DUMMY_LOGS = []; // logs from RTDB

  // DOM helpers
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Elements
  const adminSignOutBtn = qs('#admin-sign-out');
  const adminTabBtns = qsa('.admin-tab-btn');
  const tabContents = qsa('.tab-content');
  const adminVehicleCards = qsa('.admin-vehicle-card');
  const slotStatusModal = qs('#slot-status-modal');
  const slotDetailsModal = qs('#slot-details-modal');
  const closeGenericModalBtns = qsa('.close-modal-btn');
  const modalSlotGrid = qs('#modal-slot-grid');
  const motorcycleOccupancyDisplay = qs('#motorcycle-occupancy');
  const carOccupancyDisplay = qs('#car-occupancy');
  const logListContainer = qs('#log-list-container');
  const detailCategory = qs('#detail-category');
  const detailContact = qs('#detail-contact');
  const detailPlate = qs('#detail-plate');
  const detailSlotBadge = qs('#detail-slot-badge');
  const statusFooterBtn = qs('#status-footer-btn');
  const qrReaderContainer = qs('#qr-reader');
  const motoTotalInput = qs('#motorcycle-total-input');
  const carTotalInput = qs('#car-total-input');
  const motoTotalSaveBtn = qs('#motorcycle-total-save');
  const carTotalSaveBtn = qs('#car-total-save');

  let currentSlotType = '';
  let currentSlotId = '';

  // --- Occupancy helpers ---
  const getOccupancy = (type) => {
    const prefix = type === 'Motorcycle' ? 'A' : 'B';
    const slotsOfType = Object.keys(slotStatus).filter((key) => key.startsWith(prefix));
    const occupiedCount = slotsOfType.filter((key) => slotStatus[key]).length;
    const total =
      type === 'Motorcycle'
        ? motorcycleTotal || slotsOfType.length
        : carTotal || slotsOfType.length;
    return { occupied: occupiedCount, total: total || 0 };
  };

  const updateOccupancyUI = () => {
    const motorStats = getOccupancy('Motorcycle');
    const carStats = getOccupancy('Car');
    if (motorcycleOccupancyDisplay) {
      motorcycleOccupancyDisplay.textContent = `${motorStats.occupied} / ${motorStats.total}`;
    }
    if (carOccupancyDisplay) {
      carOccupancyDisplay.textContent = `${carStats.occupied} / ${carStats.total}`;
    }
  };

  // --- Logs rendering ---
  const renderLogsList = (logs) => {
    if (!logListContainer) return;
    logListContainer.innerHTML = '';
    if (!logs || logs.length === 0) {
      logListContainer.innerHTML =
        '<p style="color:var(--text-light); text-align: center;">No report logs available.</p>';
      return;
    }

    const sorted = logs
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    sorted.forEach((log) => {
      const isExited = log.status === 'EXITED';
      const statusColor = isExited ? 'var(--success-color)' : 'var(--occupied-color)';
      const statusIcon = isExited
        ? 'fas fa-arrow-alt-circle-left'
        : 'fas fa-arrow-alt-circle-right';
      const timeOutDisplay = log.timeOut ? ` - ${log.timeOut}` : '';

      // Use full name from mobile app if available, otherwise fallback to userId
      // Prioritize userName from mobile app profile
      const name = log.userName || (log.userId ? log.userId : 'Unknown User');
      const initial = name.charAt(0).toUpperCase();
      
      // Use initial only (images removed to prevent errors)
      const avatarContent = initial;

      const item = document.createElement('div');
      item.classList.add('log-item');
      item.innerHTML = `
        <div class="log-avatar" style="background-color: ${statusColor}; overflow:hidden;">${avatarContent}</div>
        <div class="log-details">
          <p class="name-info">${name} - <span style="font-weight: 500;">${log.plate || 'N/A'}</span></p>
          <p class="time-info">Slot ID: ${log.slotId || 'N/A'}</p>
          <p class="time-info">Status time: ${log.timeIn || 'N/A'}${timeOutDisplay}</p>
          <p class="time-info" style="color: ${statusColor}; font-weight: 700; grid-column: 3 / 4; text-align: right;">
            <i class="${statusIcon}"></i> ${log.status}
          </p>
        </div>
      `;
      logListContainer.appendChild(item);
    });
  };

  // --- QR generation (admin shows QR, mobile scans) ---
  const generateQR = (payloadObj) => {
    if (!qrReaderContainer) return;
    const dataString =
      typeof payloadObj === 'string' ? payloadObj : JSON.stringify(payloadObj);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      dataString,
    )}`;

    qrReaderContainer.innerHTML = `
      <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;">
        <img src="${qrUrl}" alt="QR Code" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:6px;">
      </div>
    `;
  };

  // --- Slot details panel ---
  const handleSlotDetailsUpdate = (slotId, details) => {
    const category = slotId.startsWith('A') ? 'Motorcycle' : 'Car';
    if (detailSlotBadge) detailSlotBadge.textContent = slotId;

    if (!statusFooterBtn) return;
    statusFooterBtn.classList.remove('occupied-status-footer', 'available-status-footer');

    if (details) {
      if (detailCategory) {
        detailCategory.textContent = (details.category || category).toUpperCase();
      }
      if (detailContact) {
        detailContact.textContent = details.contact || 'N/A';
      }
      if (detailPlate) {
        detailPlate.textContent = details.plate || 'N/A';
      }

      statusFooterBtn.classList.add('occupied-status-footer');
      statusFooterBtn.textContent = `OCCUPIED - TIME IN: ${details.timeIn || 'N/A'}`;

      const payload = {
        slot: slotId,
        category: details.category || category,
      };
      generateQR(payload);
    } else {
      if (detailCategory) {
        detailCategory.textContent = category.toUpperCase();
      }
      if (detailContact) {
        detailContact.textContent = 'N/A';
      }
      if (detailPlate) {
        detailPlate.textContent = 'N/A';
      }

      statusFooterBtn.classList.add('available-status-footer');
      statusFooterBtn.textContent = 'AVAILABLE - READY FOR ENTRY SCAN';

      const payload = {
        slot: slotId,
        category: category,
      };
      generateQR(payload);
    }
  };

  // --- Slot grid ---
  const renderSlotGridModal = (type) => {
    if (!modalSlotGrid) return;
    modalSlotGrid.innerHTML = '';
    const prefix = type === 'Motorcycle' ? 'A' : 'B';
    const total = type === 'Motorcycle' ? motorcycleTotal : carTotal;
    const maxSlots = total && total > 0 ? total : 0;
    const slotsOfType = [];
    for (let i = 1; i <= maxSlots; i++) {
      slotsOfType.push(`${prefix}${i}`);
    }
    modalSlotGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';

    slotsOfType.forEach((slotId) => {
      const isOccupied = !!slotStatus[slotId];
      const details = PARKED_DATA_BY_SLOT[slotId];
      const plateDisplay = isOccupied ? details?.plate || 'PARKED' : 'AVAILABLE';
      const statusClass = isOccupied ? 'occupied' : 'available';

      const slotItem = document.createElement('div');
      slotItem.classList.add('slot-item-modal', statusClass);
      slotItem.setAttribute('data-slot-id', slotId);
      slotItem.innerHTML = `
        <p style="margin:0; font-size: 1.1rem;">${slotId}</p>
        <span style="font-size: 0.7rem; font-weight: 500;">${plateDisplay}</span>
      `;

      slotItem.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-slot-id');
        currentSlotId = id;
        currentSlotType = id.startsWith('A') ? 'Motorcycle' : 'Car';

        if (slotStatusModal) slotStatusModal.style.display = 'none';
        if (slotDetailsModal) slotDetailsModal.style.display = 'flex';

        const det = PARKED_DATA_BY_SLOT[id] || null;
        handleSlotDetailsUpdate(id, det);
      });

      modalSlotGrid.appendChild(slotItem);
    });
  };

  // --- Tabs & modals ---
  adminVehicleCards.forEach((card) => {
    card.addEventListener('click', () => {
      currentSlotType = card.getAttribute('data-vehicle');
      renderSlotGridModal(currentSlotType);
      if (slotStatusModal) slotStatusModal.style.display = 'flex';
    });
  });

  adminTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      adminTabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((content) => (content.style.display = 'none'));
      btn.classList.add('active');
      const content = qs(`#${targetTab}-content`);
      if (content) content.style.display = 'block';

      if (targetTab === 'logs') {
        renderLogsList(DUMMY_LOGS);
      }
    });
  });

  closeGenericModalBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetModalId = btn.getAttribute('data-modal');
      const modal = qs(`#${targetModalId}`);
      if (modal) modal.style.display = 'none';

      if (targetModalId === 'slot-details-modal' && currentSlotType) {
        renderSlotGridModal(currentSlotType);
        if (slotStatusModal) slotStatusModal.style.display = 'flex';
      }
    });
  });

  if (adminSignOutBtn) {
    adminSignOutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Signing out...');
      window.location.href = 'index.html';
    });
  }

  // --- Live Firebase subscriptions ---
  const slotsRef = db.ref('parking-management/slots');
  const logsRef = db.ref('parking-management/logs');
  const settingsRef = db.ref('parking-management/settings');

  // Settings: total slots per type
  settingsRef.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    if (typeof data.motorcycleTotal === 'number') {
      motorcycleTotal = data.motorcycleTotal;
      if (motoTotalInput) motoTotalInput.value = String(data.motorcycleTotal);
    }
    if (typeof data.carTotal === 'number') {
      carTotal = data.carTotal;
      if (carTotalInput) carTotalInput.value = String(data.carTotal);
    }
    updateOccupancyUI();
    if (slotStatusModal && slotStatusModal.style.display === 'flex' && currentSlotType) {
      renderSlotGridModal(currentSlotType);
    }
  });

  slotsRef.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    slotStatus = {};
    PARKED_DATA_BY_SLOT = {};

    Object.entries(data).forEach(([slotId, v]) => {
      const val = v || {};
      const occupied = !!val.occupied;
      slotStatus[slotId] = occupied;
      if (occupied) {
        PARKED_DATA_BY_SLOT[slotId] = {
          category: val.category || (slotId.startsWith('A') ? 'Motorcycle' : 'Car'),
          contact: val.contact || 'N/A',
          plate: val.plate || 'N/A',
          user: val.userName || val.userId || `USER_${slotId}`,
          userName: val.userName || null,
          userImageUrl: val.userImageUrl || null,
          timeIn: val.timeIn || null,
        };
      }
    });

    updateOccupancyUI();

    if (slotStatusModal && slotStatusModal.style.display === 'flex' && currentSlotType) {
      renderSlotGridModal(currentSlotType);
    }
    if (slotDetailsModal && slotDetailsModal.style.display === 'flex' && currentSlotId) {
      const det = PARKED_DATA_BY_SLOT[currentSlotId] || null;
      handleSlotDetailsUpdate(currentSlotId, det);
    }
  });

  logsRef.on('value', (snapshot) => {
    const data = snapshot.val() || {};
    DUMMY_LOGS = Object.values(data);
    const logsTabActive = qs('.admin-tab-btn[data-tab="logs"]')?.classList.contains('active');
    if (logsTabActive) {
      renderLogsList(DUMMY_LOGS);
    }
  });

  // Handlers to save totals back to Firebase settings
  if (motoTotalSaveBtn && motoTotalInput) {
    motoTotalSaveBtn.addEventListener('click', () => {
      const v = parseInt(motoTotalInput.value, 10);
      if (!Number.isFinite(v) || v <= 0) {
        alert('Please enter a valid number of Motorcycle slots.');
        return;
      }
      motorcycleTotal = v;
      settingsRef.child('motorcycleTotal').set(v);
    });
  }

  if (carTotalSaveBtn && carTotalInput) {
    carTotalSaveBtn.addEventListener('click', () => {
      const v = parseInt(carTotalInput.value, 10);
      if (!Number.isFinite(v) || v <= 0) {
        alert('Please enter a valid number of Car slots.');
        return;
      }
      carTotal = v;
      settingsRef.child('carTotal').set(v);
    });
  }

  // Initial occupancy display
  updateOccupancyUI();
});


