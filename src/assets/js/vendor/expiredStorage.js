function removeLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        return false;
    }
    return true;
}

function getLocalStorage(key) {
    if (!localStorage.getItem(key) || key === null) {
        return null;
    }

    try {
        var objectInStorage = JSON.parse(localStorage.getItem(key));
        if (objectInStorage.expiration < Date.now()) {
            return removeLocalStorage(key) ? null : objectInStorage.value;
        } else {
            try {
                return objectInStorage.value;
            } catch (e) {
                return null;
            }
        }
    } catch (e) {
        return localStorage.getItem(key);
    }
}

function setLocalStorage(key, value, expires = null) {
    if (key === null) {
        return false;
    }

    if (!(expires === undefined || expires === null)) {
        expires = Math.abs(expires);
    }

    try {
        if (expires != undefined && expires != null) {
            let expirationTimestamp = expires < Date.now() ? Date.now() + expires*1000 : expires;
            localStorage.setItem(key, JSON.stringify({value:value, expiration: expirationTimestamp}));
        } else {
            localStorage.setItem(key, value);
        }
    } catch(e) {
        return false;
    }
    return true;
}