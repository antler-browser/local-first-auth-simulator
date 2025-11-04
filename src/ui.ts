import type { Simulator } from './simulator';

/**
 * Create the floating debug UI panel
 */
export function createDebugUI(simulator: Simulator): void {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => createDebugUIImpl(simulator));
  } else {
    createDebugUIImpl(simulator);
  }
}

function createDebugUIImpl(simulator: Simulator): void {
  // State management
  let isExpanded = false;

  const container = document.createElement('div');
  container.id = 'irl-browser-simulator-debug';

  const profile = simulator.getCurrentProfile();
  const truncatedDID = profile.did.length > 30 ? profile.did.substring(0, 30) + '...' : profile.did;

  container.innerHTML = `
    <style>
      #irl-browser-simulator-debug {
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        max-width: 320px;
      }
      .irl-sim-panel {
        background: #1e1e1e;
        color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        overflow: hidden;
      }
      .irl-sim-header {
        background: #2d2d2d;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }
      .irl-sim-close {
        background: none;
        border: none;
        color: #888;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
      .irl-sim-close:hover { color: #fff; }
      .irl-sim-body {
        padding: 16px;
      }
      .irl-sim-section {
        margin-bottom: 16px;
      }
      .irl-sim-section:last-child {
        margin-bottom: 0;
      }
      .irl-sim-label {
        color: #888;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      .irl-sim-btn {
        background: #0066cc;
        color: #fff;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        margin-bottom: 6px;
        font-size: 13px;
        transition: all 0.15s ease;
        position: relative;
      }
      .irl-sim-btn:hover {
        background: #0052a3;
      }
      .irl-sim-btn:active {
        background: #003d7a;
        transform: scale(0.98);
      }
      .irl-sim-btn.clicked {
        background: #00aa00;
      }
      .irl-sim-btn:last-child {
        margin-bottom: 0;
      }
      .irl-sim-profile {
        font-size: 12px;
        color: #888;
        padding: 8px 12px;
        background: #2d2d2d;
        border-radius: 4px;
        margin-bottom: 6px;
      }
      .irl-sim-profile strong {
        color: #fff;
      }
      .irl-sim-collapsed-icon {
        width: 50px;
        height: 50px;
        background: #1e1e1e;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid #2d2d2d;
      }
      .irl-sim-collapsed-icon:hover {
        background: #2d2d2d;
        transform: scale(1.05);
      }
      .irl-sim-icon-text {
        color: #fff;
        font-size: 10px;
        font-weight: 600;
        margin-top: 2px;
      }
      .irl-sim-icon-emoji {
        font-size: 20px;
        line-height: 1;
      }
      .irl-sim-panel {
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      .irl-sim-panel.hidden {
        display: none;
      }
      .irl-sim-collapsed-icon.hidden {
        display: none;
      }
      @media (max-width: 480px) {
        #irl-browser-simulator-debug {
          bottom: 5px;
          right: 5px;
          max-width: calc(100vw - 10px);
        }
      }
    </style>
    <div class="irl-sim-collapsed-icon" id="irl-sim-collapsed-icon">
      <div class="irl-sim-icon-emoji">🐛</div>
    </div>
    <div class="irl-sim-panel hidden" id="irl-sim-panel">
      <div class="irl-sim-header">
        <span>IRL Browser Debugger</span>
        <button class="irl-sim-close" id="irl-sim-close-btn">&times;</button>
      </div>
      <div class="irl-sim-body">
        <div class="irl-sim-section">
          <div class="irl-sim-label">Current Profile</div>
          <div class="irl-sim-profile">
            <strong>${profile.name}</strong><br>
            <span>${truncatedDID}</span>
          </div>
        </div>
        <div class="irl-sim-section">
          <div class="irl-sim-label">API Methods</div>
          <button class="irl-sim-btn" id="irl-sim-get-profile">Get Profile Details</button>
          <button class="irl-sim-btn" id="irl-sim-get-avatar">Get Avatar</button>
          <button class="irl-sim-btn" id="irl-sim-get-browser">Get Browser Details</button>
        </div>
        <div class="irl-sim-section">
          <div class="irl-sim-label">Events</div>
          <button class="irl-sim-btn" id="irl-sim-disconnect">Trigger Profile Disconnected</button>
          <button class="irl-sim-btn" id="irl-sim-close">Close WebView</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Helper function to show visual feedback on button click
  const showButtonFeedback = (button: HTMLElement) => {
    button.classList.add('clicked');
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 400);
  };

  // Helper function to toggle expanded state
  const toggleExpanded = () => {
    isExpanded = !isExpanded;
    const panel = document.getElementById('irl-sim-panel');
    const icon = document.getElementById('irl-sim-collapsed-icon');

    if (isExpanded) {
      icon?.classList.add('hidden');
      panel?.classList.remove('hidden');
    } else {
      panel?.classList.add('hidden');
      icon?.classList.remove('hidden');
    }
  };

  // Attach event listeners
  const collapsedIcon = document.getElementById('irl-sim-collapsed-icon');
  if (collapsedIcon) {
    collapsedIcon.addEventListener('click', toggleExpanded);
  }

  const closeBtn = document.getElementById('irl-sim-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', toggleExpanded);
  }

  const getProfileBtn = document.getElementById('irl-sim-get-profile');
  if (getProfileBtn) {
    getProfileBtn.addEventListener('click', async () => {
      showButtonFeedback(getProfileBtn);
      const jwt = await window.irlBrowser?.getProfileDetails();
      console.log('Profile JWT:', jwt);
    });
  }

  const getAvatarBtn = document.getElementById('irl-sim-get-avatar');
  if (getAvatarBtn) {
    getAvatarBtn.addEventListener('click', async () => {
      showButtonFeedback(getAvatarBtn);
      const jwt = await window.irlBrowser?.getAvatar();
      console.log('Avatar JWT:', jwt);
    });
  }

  const getBrowserBtn = document.getElementById('irl-sim-get-browser');
  if (getBrowserBtn) {
    getBrowserBtn.addEventListener('click', () => {
      showButtonFeedback(getBrowserBtn);
      const details = window.irlBrowser?.getBrowserDetails();
      console.log('Browser Details:', details);
    });
  }

  const disconnectBtn = document.getElementById('irl-sim-disconnect');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
      showButtonFeedback(disconnectBtn);
      simulator.sendDisconnectMessage();
    });
  }

  const closeWebViewBtn = document.getElementById('irl-sim-close');
  if (closeWebViewBtn) {
    closeWebViewBtn.addEventListener('click', () => {
      showButtonFeedback(closeWebViewBtn);
      window.irlBrowser?.close();
    });
  }

  // Keyboard shortcut: Ctrl+Shift+I to toggle between collapsed and expanded
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      toggleExpanded();
    }
  });
}
