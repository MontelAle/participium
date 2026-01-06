export const BUTTONS = {
  CANCEL: '❌ Cancel',
  DONE: '✅ Done',
  CONFIRM: '✅ Confirm',
  LINK_ACCOUNT: '🔗 Link Account',
  REGISTER: '📝 Register',
  NEW_REPORT: '📝 New Report',
  VIEW_MAP: '🗺️ Reports Map',
  VIEW_REPORT: '🔍 View Report',
  ANONYMOUS_YES: '🕵️ Yes, anonymous',
  ANONYMOUS_NO: '👤 No, with my name',
};

export const ACTIONS = {
  LINK_ACCOUNT: 'link_account',
  START_NEW_REPORT: 'start_newreport',
  ANONYMOUS_YES: 'anonymous_yes',
  ANONYMOUS_NO: 'anonymous_no',
  CONFIRM_YES: 'confirm_yes',
  CANCEL: 'cancel',
  CATEGORY_PREFIX: 'category_',
};

export const MESSAGES = {
  WELCOME_LINKED:
    'Welcome back to Participium! 👋\n\n<b>Available Commands:</b>\n/newreport - Create a new report\n/help - Show help',
  WELCOME_UNLINKED:
    'Welcome to Participium! 🏛️\n\nThis bot allows you to report issues directly from Telegram.\nTo get started, you must link your account.',
  ERR_NOT_LINKED:
    '🔗 You need to link your account first. Use /link to get started.',
  ERR_EMAIL_VERIFY:
    '📧 Please verify your email address first. Check your inbox.',
  ERR_GENERIC: '❌ An error occurred. Please try again later.',
  ERR_OUTSIDE_BOUNDARIES:
    '❌ This location is outside the Turin municipal area.\nPlease share a location within the boundaries.',
  ERR_PHOTO_LIMIT:
    '❌ Maximum of 3 photos reached. Type /done or press the button to continue.',
  ERR_NO_PHOTOS: '❌ You must send at least 1 photo.',
  ERR_INVALID_TITLE: '❌ Title must be between 1 and 100 characters.',
  ERR_INVALID_DESC: '❌ Description must be between 10 and 1000 characters.',
  ERR_TEXT_LOCATION:
    '❌ Text addresses are not supported. Please use the attachment icon 📎 to send your GPS location.',
  CANCELLED: '❌ Operation cancelled.',
  CREATING_REPORT: '⏳ Creating your report...',
  SUCCESS_REPORT: '✅ <b>Report created successfully!</b>',
  STEP_LOCATION:
    '📍 <b>Step 1/7: Location</b>\n\nPlease share the location of the issue by clicking the button below or using the attachment menu (📎).',
  STEP_TITLE:
    '📝 <b>Step 2/7: Title</b>\n\nPlease enter a short title for your report (max 100 characters).',
  STEP_DESC:
    '📄 <b>Step 3/7: Description</b>\n\nPlease describe the issue in detail (max 1000 characters).',
  STEP_CATEGORY: '🗂️ <b>Step 4/7: Category</b>\n\nPlease select a category:',
  STEP_PHOTOS:
    '📷 <b>Step 5/7: Photos</b>\n\nPlease send 1 to 3 photos of the issue.\nPress "Done" when you are finished.',
  STEP_ANONYMITY:
    '👤 <b>Step 6/7: Privacy</b>\n\nWould you like to submit this report anonymously?',
  STEP_CONFIRM: '✅ <b>Step 7/7: Confirmation</b>',
  LINK_ALREADY_LINKED:
    '⚠️ Your Telegram account is already linked to user: <b>{username}</b>.\nIf you need to unlink, please contact support.',
  LINK_INSTRUCTIONS:
    '🔗 <b>Account Linking</b>\n\nTo link your Telegram account:\n1. Open the linking page below\n2. Enter this code: <code>{code}</code>\n\n⏰ Code expires in 15 minutes',
  LINK_SUCCESS:
    '✅ <b>Account linked successfully!</b>\n\nYour Telegram account is now connected to Participium.\n\n<b>What you can do now:</b>\n• Use /newreport to create a new issue report\n• Use /help to see all available commands',
  LBL_LINKING_PAGE: '🔗 Open Linking Page',
  LBL_REGISTER: '📝 Register',
  LBL_NEW_REPORT: '📝 Create New Report',
  LBL_VIEW_MAP: '🗺️ View Reports Map',
};
