export async function withEncounterProgress(message, work) {
  const notification = ui.notifications.info(
    `<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> ${foundry.utils.escapeHTML(message)}`,
    { permanent: true, escape: false }
  );
  try {
    // Let the browser display the notification before indexing or generating.
    await new Promise(resolve => setTimeout(resolve, 0));
    return await work();
  } finally {
    notification.remove();
  }
}
