import type { Simulator } from './simulator';
import type { Profile } from './types';
import { PRESET_PROFILES } from './profiles';
import { buildUrlWithProfile } from './urlUtils';

/**
 * Profile colors for visual distinction in multi-window testing
 */
const PROFILE_COLORS: Record<string, string> = {
  'paul': '#3498db',
  'alice': '#e74c3c',
  'bob': '#2ecc71',
  'charlie': '#f49ac1',
  'divya': '#f49c53',
  'eva': '#9c27b0',
};

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
  container.id = 'local-first-auth-simulator-debug';

  const profile = simulator.getCurrentProfile();
  const truncatedDID = profile.did.length > 30 ? profile.did.substring(0, 30) + '...' : profile.did;
  const profileColor = PROFILE_COLORS[profile.profileId] || '#3498db';

  // Get other profiles (excluding current one) for switcher buttons
  const otherProfiles: Profile[] = PRESET_PROFILES.filter(p => p.profileId !== profile.profileId);

  container.innerHTML = `
    <style>
      #local-first-auth-simulator-debug {
        position: fixed;
        bottom: 10px;
        left: 10px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        max-width: 340px;
      }
      .lfa-sim-panel {
        background: #1e1e1e;
        color: #fff;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05);
        overflow: hidden;
      }
      .lfa-sim-header {
        background: linear-gradient(135deg, #2d2d2d 0%, #252525 100%);
        padding: 14px 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .lfa-sim-close {
        background: none;
        border: none;
        color: #999;
        font-size: 22px;
        cursor: pointer;
        padding: 4px 8px;
        line-height: 1;
        border-radius: 4px;
        transition: all 0.15s ease;
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lfa-sim-close:hover {
        color: #fff;
        background: rgba(255,255,255,0.08);
      }
      .lfa-sim-close:focus-visible {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }
      .lfa-sim-body {
        padding: 18px;
      }
      .lfa-sim-section {
        margin-bottom: 20px;
      }
      .lfa-sim-section:last-child {
        margin-bottom: 0;
      }
      .lfa-sim-label {
        color: #aaa;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 10px;
        font-weight: 600;
      }
      .lfa-sim-btn {
        background: #0066cc;
        color: #fff;
        border: none;
        padding: 12px 16px;
        border-radius: 6px;
        cursor: pointer;
        width: 100%;
        margin-bottom: 8px;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.15s ease;
        position: relative;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lfa-sim-btn:hover {
        background: #0052a3;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,102,204,0.3);
      }
      .lfa-sim-btn:active {
        background: #003d7a;
        transform: translateY(0);
      }
      .lfa-sim-btn:focus-visible {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }
      .lfa-sim-btn.clicked {
        background: #00aa00;
      }
      .lfa-sim-btn:last-child {
        margin-bottom: 0;
      }
      .lfa-sim-btn-profile {
        background: #333;
        color: #fff;
        text-align: left;
        justify-content: flex-start;
        gap: 12px;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .lfa-sim-btn-profile:hover {
        background: #3d3d3d;
        border-color: rgba(255,255,255,0.12);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      .lfa-sim-btn-profile:active {
        background: #424242;
      }
      .lfa-sim-profile-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        flex-shrink: 0;
        object-fit: cover;
        border: 2px solid rgba(255,255,255,0.15);
      }
      .lfa-sim-profile-avatar-large {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        flex-shrink: 0;
        object-fit: cover;
        border: 3px solid ${profileColor};
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      .lfa-sim-profile-badge {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        flex-shrink: 0;
        border: 2px solid rgba(255,255,255,0.15);
      }
      .lfa-sim-profile-badge-large {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 600;
        flex-shrink: 0;
        border: 3px solid ${profileColor};
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      .lfa-sim-profile {
        font-size: 13px;
        color: #bbb;
        padding: 12px 14px;
        background: #2a2a2a;
        border-radius: 6px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(255,255,255,0.06);
      }
      .lfa-sim-profile strong {
        color: #fff;
        font-size: 14px;
        display: block;
        margin-bottom: 2px;
      }
      .lfa-sim-profile-details {
        flex: 1;
        min-width: 0;
      }
      .lfa-sim-profile-did {
        font-size: 11px;
        color: #888;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .lfa-sim-collapsed-icon {
        width: 56px;
        height: 56px;
        background: #1e1e1e;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        padding: 0;
      }
      .lfa-sim-collapsed-icon:hover {
        background: #2d2d2d;
        transform: scale(1.08);
        box-shadow: 0 6px 20px rgba(0,0,0,0.5);
      }
      .lfa-sim-collapsed-icon:focus-visible {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }
      .lfa-sim-icon-emoji {
        font-size: 24px;
        line-height: 1;
      }
      .lfa-sim-panel {
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      .lfa-sim-panel.hidden {
        display: none;
      }
      .lfa-sim-collapsed-icon.hidden {
        display: none;
      }
      @media (max-width: 480px) {
        #local-first-auth-simulator-debug {
          bottom: 5px;
          left: 5px;
          max-width: calc(100vw - 10px);
        }
        .lfa-sim-body {
          padding: 14px;
        }
        .lfa-sim-btn,
        .lfa-sim-btn-profile {
          min-height: 48px;
          font-size: 14px;
        }
        .lfa-sim-close {
          min-width: 48px;
          min-height: 48px;
        }
      }
    </style>
    <button class="lfa-sim-collapsed-icon" id="lfa-sim-collapsed-icon" aria-label="Open Local First Auth Debugger" aria-expanded="false">
      <div class="lfa-sim-icon-emoji">🐛</div>
    </button>
    <div class="lfa-sim-panel hidden" id="lfa-sim-panel" role="region" aria-label="Local First Auth Debugger">
      <div class="lfa-sim-header">
        <span>Local First Auth Debugger</span>
        <button class="lfa-sim-close" id="lfa-sim-close-btn" aria-label="Close debugger">&times;</button>
      </div>
      <div class="lfa-sim-body">
        <div class="lfa-sim-section">
          <div class="lfa-sim-label">Current Profile</div>
          <div class="lfa-sim-profile">
            ${profile.avatar
              ? `<img src="${profile.avatar}" alt="${profile.name}" class="lfa-sim-profile-avatar-large" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                 <div class="lfa-sim-profile-badge-large" style="background-color: ${profileColor}; display: none;">${profile.name.charAt(0)}</div>`
              : `<div class="lfa-sim-profile-badge-large" style="background-color: ${profileColor}">${profile.name.charAt(0)}</div>`
            }
            <div class="lfa-sim-profile-details">
              <strong>${profile.name}</strong>
              <div class="lfa-sim-profile-did" title="${profile.did}">${truncatedDID}</div>
            </div>
          </div>
        </div>
        <div class="lfa-sim-section">
          <div class="lfa-sim-label">Open as Different User</div>
          ${otherProfiles.map(p => {
            const color = PROFILE_COLORS[p.profileId] || '#666';
            return `<button class="lfa-sim-btn lfa-sim-btn-profile" data-profile-id="${p.profileId}" aria-label="Open as ${p.name}">
              ${p.avatar
                ? `<img src="${p.avatar}" alt="${p.name}" class="lfa-sim-profile-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <div class="lfa-sim-profile-badge" style="background-color: ${color}; display: none;">${p.name.charAt(0)}</div>`
                : `<div class="lfa-sim-profile-badge" style="background-color: ${color}">${p.name.charAt(0)}</div>`
              }
              <span>${p.name}</span>
            </button>`;
          }).join('\n          ')}
        </div>
        <div class="lfa-sim-section">
          <div class="lfa-sim-label">Events</div>
          <button class="lfa-sim-btn" id="lfa-sim-disconnect" aria-label="Trigger profile disconnected event">Trigger Profile Disconnected</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Helper function to show visual feedback on button click
  const showButtonFeedback = (button: HTMLElement) => {
    const originalText = button.textContent || '';
    button.classList.add('clicked');
    button.textContent = '✅ ' + originalText;
    setTimeout(() => {
      button.classList.remove('clicked');
      button.textContent = originalText;
    }, 400);
  };

  // Helper function to toggle expanded state
  const toggleExpanded = () => {
    isExpanded = !isExpanded;
    const panel = document.getElementById('lfa-sim-panel');
    const icon = document.getElementById('lfa-sim-collapsed-icon') as HTMLButtonElement;

    if (isExpanded) {
      icon?.classList.add('hidden');
      icon?.setAttribute('aria-expanded', 'true');
      panel?.classList.remove('hidden');
    } else {
      panel?.classList.add('hidden');
      icon?.classList.remove('hidden');
      icon?.setAttribute('aria-expanded', 'false');
    }
  };

  // Attach event listeners
  const collapsedIcon = document.getElementById('lfa-sim-collapsed-icon');
  if (collapsedIcon) {
    collapsedIcon.addEventListener('click', toggleExpanded);
  }

  const closeBtn = document.getElementById('lfa-sim-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', toggleExpanded);
  }

  const disconnectBtn = document.getElementById('lfa-sim-disconnect');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
      showButtonFeedback(disconnectBtn);
      simulator.sendDisconnectMessage();
    });
  }

  // Profile switcher buttons
  const profileButtons = document.querySelectorAll('.lfa-sim-btn-profile');
  profileButtons.forEach(button => {
    button.addEventListener('click', () => {
      const profileId = button.getAttribute('data-profile-id');
      if (profileId) {
        const newUrl = buildUrlWithProfile(profileId as any); // Runtime check ensures valid profileId
        window.open(newUrl, '_blank');
      }
    });
  });

  // Keyboard shortcut: Ctrl+Shift+D to toggle between collapsed and expanded
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      toggleExpanded();
    }
  });
}
