import { Notification, app } from 'electron';
import { focusOnProject } from '../windows';
import { setTrayAttention } from '../tray';

export function showNotification(
  projectName: string,
  body: string,
  workspaceId: string
): void {
  // Set tray attention indicator
  setTrayAttention(true);

  // Check if notifications are supported
  if (!Notification.isSupported()) {
    console.log('Notifications not supported on this platform');
    return;
  }

  const notification = new Notification({
    title: `Secret Agent: ${projectName}`,
    body: body,
    silent: false,
    urgency: 'normal',
    // On macOS, use the app icon
    // On Windows, you can specify a custom icon
  });

  notification.on('click', () => {
    // Focus on the specific project when notification is clicked
    focusOnProject(workspaceId);
    // Clear attention indicator
    setTrayAttention(false);
  });

  notification.on('close', () => {
    // Notification was dismissed
  });

  notification.show();
}

export function clearAttention(): void {
  setTrayAttention(false);
}

