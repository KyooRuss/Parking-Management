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
  const sampleVehicleListContainer = qs('#sample-vehicle-list');
  const motorcycleOccupancyDisplay = qs('#motorcycle-occupancy');
  const carOccupancyDisplay = qs('#car-occupancy');
  const logListContainer = qs('#log-list-container');
  const detailCategory = qs('#detail-category');
  const detailContact = qs('#detail-contact');
  const detailPlate = qs('#detail-plate');
  const detailSlotBadge = qs('#detail-slot-badge');
  const detailSlotStatus = qs('#detail-slot-status');
  const statusFooterBtn = qs('#status-footer-btn');
  const qrReaderContainer = qs('#qr-reader');
  const motoTotalInput = qs('#motorcycle-total-input');
  const carTotalInput = qs('#car-total-input');
  const motoTotalSaveBtn = qs('#motorcycle-total-save');
  const carTotalSaveBtn = qs('#car-total-save');
  const maintenanceToggle = qs('#maintenance-toggle');
  const reservedToggle = qs('#reserved-toggle');
  const saveSlotFlagsBtn = qs('#save-slot-flags-btn');
  const sampleVehicleSelect = qs('#sample-vehicle-select');
  const assignSampleVehicleBtn = qs('#assign-sample-vehicle-btn');
  const assignHelperText = qs('#assign-helper-text');
  const openSampleVehiclesModalBtn = qs('#open-sample-vehicles-modal-btn');
  const sampleVehiclesModal = qs('#sample-vehicles-modal');
  const sampleVehicleSearchInput = qs('#sample-vehicle-search');
  const adminLeaveSlotBtn = qs('#admin-leave-slot-btn');

  let currentSlotType = '';
  let currentSlotId = '';
  let currentSlotCategory = ''; // 'Motorcycle' | 'Car'

  // --- Additional slot flags (maintenance / reserved) ---
  let MAINTENANCE_STATUS = {}; // { A1: true/false }
  let RESERVED_STATUS = {}; // { A1: true/false }

  // --- Sample registered vehicles (for manual assignment) ---
  const SAMPLE_VEHICLES = [
    // Motorcycle samples
    { id: 'M1', type: 'Motorcycle', plate: 'KNT-2821', contact: '0907-543-4634' },
    { id: 'M2', type: 'Motorcycle', plate: 'MCY-1234', contact: '0911-222-3333' },
    { id: 'M3', type: 'Motorcycle', plate: 'RDX-9087', contact: '0908-765-4321' },
    // Car samples
    { id: 'C1', type: 'Car', plate: 'XYZ-4360', contact: '0912-345-6789' },
    { id: 'C2', type: 'Car', plate: 'CAR-5678', contact: '0909-555-1212' },
    { id: 'C3', type: 'Car', plate: 'PLT-8899', contact: '0917-888-9999' },
  ];

  const renderSampleVehiclesList = (filterText = '') => {
    if (!sampleVehicleListContainer) return;
    sampleVehicleListContainer.innerHTML = '';
    const ft = filterText.trim().toLowerCase();
    SAMPLE_VEHICLES.filter((v) => {
      // Only show vehicles for the current slot category if we know it
      if (currentSlotCategory && v.type !== currentSlotCategory) return false;
      if (!ft) return true;
      const haystack = `${v.type} ${v.plate} ${v.contact}`.toLowerCase();
      return haystack.includes(ft);
    }).forEach((v) => {
      const pill = document.createElement('div');
      pill.classList.add('sample-vehicle-pill');
      pill.setAttribute('data-vehicle-id', v.id);
      pill.textContent = `${v.type} • ${v.plate} • ${v.contact}`;

      // When admin clicks a sample vehicle in this modal,
      // reflect the selection in the "List of Registered Vehicles" dropdown.
      pill.addEventListener('click', () => {
        if (sampleVehicleSelect) {
          sampleVehicleSelect.value = v.id;
        }
        // Optional: close the modal after choosing a vehicle
        if (sampleVehiclesModal) {
          sampleVehiclesModal.style.display = 'none';
        }
      });

      sampleVehicleListContainer.appendChild(pill);
    });
  };

  const populateSampleVehicleSelect = () => {
    if (!sampleVehicleSelect) return;
    sampleVehicleSelect.innerHTML = '';
    SAMPLE_VEHICLES.forEach((v) => {
      // Only include vehicles matching this slot's category
      if (currentSlotCategory && v.type !== currentSlotCategory) return;
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.type} - ${v.plate} (${v.contact})`;
      sampleVehicleSelect.appendChild(opt);
    });
  };

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

    // De‑duplicate logs that are effectively the same PARK / EXIT record.
    // Sometimes the Realtime Database can contain duplicates if a write is retried;
    // here we collapse them so the admin only sees one entry.
    const uniqueMap = new Map();
    logs.forEach((log) => {
      const key = [
        log.slotId || '',
        log.status || '',
        log.vehicleId || '',
        log.plate || '',
        log.timeIn || '',
        log.timeOut || '',
      ].join('|');
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, log);
      }
    });

    const sorted = Array.from(uniqueMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
    );

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
    currentSlotCategory = category;
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

    // Update slot status label + toggle controls
    const isMaintenance = !!MAINTENANCE_STATUS[slotId];
    const isReserved = !!RESERVED_STATUS[slotId];
    if (detailSlotStatus) {
      if (isMaintenance) {
        detailSlotStatus.textContent = 'UNDER MAINTENANCE';
      } else if (isReserved) {
        detailSlotStatus.textContent = 'RESERVED';
      } else if (details) {
        detailSlotStatus.textContent = 'OCCUPIED';
      } else {
        detailSlotStatus.textContent = 'AVAILABLE';
      }
    }

    if (maintenanceToggle) {
      maintenanceToggle.checked = isMaintenance;
    }
    if (reservedToggle) {
      reservedToggle.checked = isReserved;
    }

    // Disable assignment if not allowed
    const isOccupied = !!details;
    const canAssign = !isOccupied && !isMaintenance;
    if (assignSampleVehicleBtn) {
      assignSampleVehicleBtn.disabled = !canAssign;
    }
    if (assignHelperText) {
      if (isMaintenance) {
        assignHelperText.textContent =
          'This slot is under maintenance. Clear maintenance to allow manual assignment.';
      } else if (isOccupied) {
        assignHelperText.textContent =
          'This slot is already occupied. Ask the user to leave before assigning another vehicle.';
      } else {
        assignHelperText.textContent =
          'Only available slots that are not under maintenance can be occupied.';
      }
    }

    // Refresh the registered-vehicle list for this slot's category
    populateSampleVehicleSelect();
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
      const isMaintenance = !!MAINTENANCE_STATUS[slotId];
      const isReserved = !!RESERVED_STATUS[slotId];

      let statusClass = 'available';
      let label = 'AVAILABLE';
      if (isMaintenance) {
        statusClass = 'maintenance';
        label = 'MAINTENANCE';
      } else if (isReserved) {
        statusClass = 'reserved';
        label = 'RESERVED';
      } else if (isOccupied) {
        statusClass = 'occupied';
        label = details?.plate || 'PARKED';
      }

      const slotItem = document.createElement('div');
      slotItem.classList.add('slot-item-modal', statusClass);
      slotItem.setAttribute('data-slot-id', slotId);
      slotItem.innerHTML = `
        <p style="margin:0; font-size: 1.1rem;">${slotId}</p>
        <span style="font-size: 0.7rem; font-weight: 500;">${label}</span>
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
    MAINTENANCE_STATUS = {};
    RESERVED_STATUS = {};

    Object.entries(data).forEach(([slotId, v]) => {
      const val = v || {};
      const occupied = !!val.occupied;
      slotStatus[slotId] = occupied;
      MAINTENANCE_STATUS[slotId] = !!val.maintenance;
      RESERVED_STATUS[slotId] = !!val.reserved;
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

  // Save maintenance / reserved flags from the modal
  if (saveSlotFlagsBtn && maintenanceToggle && reservedToggle) {
    // Make maintenance / reserved mutually exclusive (only one can be active at a time)
    maintenanceToggle.addEventListener('change', () => {
      if (maintenanceToggle.checked) {
        reservedToggle.checked = false;
      }
    });
    reservedToggle.addEventListener('change', () => {
      if (reservedToggle.checked) {
        maintenanceToggle.checked = false;
      }
    });

    saveSlotFlagsBtn.addEventListener('click', () => {
      if (!currentSlotId) {
        alert('No slot selected.');
        return;
      }
      const maintenance = !!maintenanceToggle.checked;
      const reserved = !!reservedToggle.checked;
      const slotRef = slotsRef.child(currentSlotId);
      slotRef.update({ maintenance, reserved });
      // local state will be updated by the listener, but we can give quick feedback
      alert('Slot status updated successfully.');
    });
  }

  // Manual assignment using sample vehicles
  if (assignSampleVehicleBtn && sampleVehicleSelect) {
    assignSampleVehicleBtn.addEventListener('click', () => {
      if (!currentSlotId) {
        alert('No slot selected.');
        return;
      }
      const selectedId = sampleVehicleSelect.value;
      const vehicle = SAMPLE_VEHICLES.find((v) => v.id === selectedId);
      if (!vehicle) {
        alert('Please choose a vehicle to assign.');
        return;
      }

      const expectedCategory = currentSlotId.startsWith('A') ? 'Motorcycle' : 'Car';
      if (vehicle.type !== expectedCategory) {
        alert(
          `This slot is for ${expectedCategory} only. Please choose a vehicle with the same category.`,
        );
        return;
      }

      const slotRef = slotsRef.child(currentSlotId);
      const now = firebase.database.ServerValue.TIMESTAMP;

      slotRef.transaction(
        (current) => {
          const existing = current || {};

          if (existing.occupied) {
            alert('This slot is already occupied.');
            return; // abort
          }
          if (existing.maintenance) {
            alert('This slot is under maintenance and cannot be occupied.');
            return; // abort
          }

          return {
            slotId: currentSlotId,
            category: vehicle.type,
            occupied: true,
            vehicleId: vehicle.id,
            plate: vehicle.plate,
            contact: vehicle.contact,
            userId: null,
            userName: null,
            userImageUrl: null,
            timeIn: now,
            maintenance: !!existing.maintenance,
            reserved: !!existing.reserved,
          };
        },
        (error, committed) => {
          if (error || !committed) return;
          // Push a single PARKED log entry after the transaction commits
          logsRef.push({
            slotId: currentSlotId,
            category: vehicle.type,
            vehicleId: vehicle.id,
            plate: vehicle.plate,
            contact: vehicle.contact,
            userId: null,
            userName: null,
            userImageUrl: null,
            status: 'PARKED',
            timeIn: now,
            timeOut: null,
            createdAt: now,
          });
        },
      );
    });
  }

  // Open modal with full sample vehicle list
  if (openSampleVehiclesModalBtn && sampleVehiclesModal) {
    openSampleVehiclesModalBtn.addEventListener('click', () => {
      if (sampleVehicleSearchInput) {
        sampleVehicleSearchInput.value = '';
      }
      renderSampleVehiclesList('');
      sampleVehiclesModal.style.display = 'flex';
    });
  }

  // Search inside sample vehicles modal
  if (sampleVehicleSearchInput) {
    sampleVehicleSearchInput.addEventListener('input', (e) => {
      const value = e.target.value || '';
      renderSampleVehiclesList(value);
    });
  }

  // Admin "Leave" action to clear a slot and create EXIT log
  if (adminLeaveSlotBtn) {
    adminLeaveSlotBtn.addEventListener('click', () => {
      if (!currentSlotId) {
        alert('No slot selected.');
        return;
      }

      const confirmLeave = window.confirm(
        `Mark slot ${currentSlotId} as LEFT? This will clear the current vehicle and free the slot.`,
      );
      if (!confirmLeave) return;

      const slotRef = slotsRef.child(currentSlotId);
      const now = firebase.database.ServerValue.TIMESTAMP;

      slotRef.transaction((current) => {
        const existing = current || {};
        if (!existing.occupied) {
          alert('This slot is already available.');
          return; // abort
        }

        const next = {
          slotId: currentSlotId,
          category: existing.category || (currentSlotId.startsWith('A') ? 'Motorcycle' : 'Car'),
          occupied: false,
          vehicleId: null,
          plate: null,
          contact: null,
          userId: null,
          userName: null,
          userImageUrl: null,
          timeIn: null,
          maintenance: !!existing.maintenance,
          reserved: !!existing.reserved,
        };

        logsRef.push({
          slotId: currentSlotId,
          category: existing.category || (currentSlotId.startsWith('A') ? 'Motorcycle' : 'Car'),
          vehicleId: existing.vehicleId || null,
          plate: existing.plate || null,
          contact: existing.contact || null,
          userId: existing.userId || null,
          userName: existing.userName || null,
          userImageUrl: existing.userImageUrl || null,
          status: 'EXITED',
          timeIn: existing.timeIn || null,
          timeOut: now,
          createdAt: now,
        });

        return next;
      });
    });
  }

  // Initial UI setup
  populateSampleVehicleSelect();
  updateOccupancyUI();
});


