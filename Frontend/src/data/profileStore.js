const keyForUserPhoto = (uid) => `profilePhoto:${uid}`

export const getProfilePhotoForUser = (uid) => {
  if (!uid) return ''
  try {
    return localStorage.getItem(keyForUserPhoto(uid)) || ''
  } catch {
    return ''
  }
}

export const setProfilePhotoForUser = (uid, dataUrl) => {
  if (!uid) return
  try {
    if (dataUrl) localStorage.setItem(keyForUserPhoto(uid), dataUrl)
    else localStorage.removeItem(keyForUserPhoto(uid))
  } catch {
    // Ignore storage errors (private mode/quota).
  }
}

