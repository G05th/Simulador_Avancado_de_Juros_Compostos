export function showModal({ title = 'Atenção', message, type = 'alert', onConfirm = null, onCancel = null }) {
    // Create modal elements if they don't exist
    let overlay = document.getElementById('custom-modal-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'custom-modal-overlay';
        overlay.className = 'modal-overlay';

        overlay.innerHTML = `
            <div class="modal-container">
                <h3 class="modal-title" id="modal-title"></h3>
                <p class="modal-message" id="modal-message"></p>
                <div class="modal-actions" id="modal-actions">
                    <!-- Buttons will be injected here -->
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close on overlay click (optional, maybe not for confirm)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && type === 'alert') {
                closeModal();
            }
        });
    }

    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const actionsEl = document.getElementById('modal-actions');

    titleEl.textContent = title;
    messageEl.textContent = message;
    actionsEl.innerHTML = ''; // Clear previous buttons

    // Create Buttons
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'modal-btn modal-btn-primary';
    confirmBtn.textContent = type === 'confirm' ? 'Confirmar' : 'OK';

    confirmBtn.onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };

    if (type === 'confirm') {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn modal-btn-secondary';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.onclick = () => {
            closeModal();
            if (onCancel) onCancel();
        };
        actionsEl.appendChild(cancelBtn);
    }

    actionsEl.appendChild(confirmBtn);

    // Show Modal
    // Small timeout to allow CSS transition to work if just created
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });

    // Focus confirm button for accessibility
    confirmBtn.focus();
}

export function closeModal() {
    const overlay = document.getElementById('custom-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        // Wait for transition to finish before removing/hiding?
        // For simplicity, just keeping it in DOM but hidden is fine,
        // or we can remove it. Let's keep it hidden.
        setTimeout(() => {
             // Optional: could remove from DOM if we wanted to clean up
             // document.body.removeChild(overlay);
        }, 300);
    }
}
