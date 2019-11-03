document.addEventListener('DOMContentLoaded', () => {

  var applicationServerKey = null;
  let isPushEnabled = false;
  const notifSwitch = $('#enable_notifications');

  $.get('src/keys.php', { json:true }, function(key) {
		applicationServerKey = key.public;  

    notifSwitch.click(function() {
      let isEnabled = !$(this).is(".active");
      if (isPushEnabled) { 
        push_unsubscribe();
      } else {
        push_subscribe();
      }
    });

    // Notifications ------------------------------------------
    if (!('serviceWorker' in navigator)) {
      changeNotificationSwitchState('incompatible');
      return;
    }
    if (!('PushManager' in window)) {
      changeNotificationSwitchState('incompatible');
      return;
    }
    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
      changeNotificationSwitchState('incompatible');
      return;
    }
    if (Notification.permission === 'denied') {
      changeNotificationSwitchState('denied');
      return;
    }
    // --------------------------------------------------------

    // Register the service worker
		navigator.serviceWorker
			.register('serviceWorker.min.js', { scope: "./" })
			.then(reg => {
				console.log('[SW] Service worker has been registered');
				push_updateSubscription();
			}, e => {
        changeNotificationSwitchState('incompatible');
      });

    // Fired when the service worker updates
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });

	});


  function changeNotificationSwitchState(state) {
    var notificationParamRow = notifSwitch.closest(".item");
    var notifStatusIcon = $('.notif-status-icon');

    $('.loader-notification').remove();

    notifStatusIcon
      .text("notifications_off")
      .removeAttr("title")
      .attr("data-original-title", "Notifications désactivées")
      .removeClass("active");

    switch (state) {
      case 'enabled':
        if(!notificationParamRow.hasClass("definitive-disabled")) {
          notifSwitch.removeClass("disabled").removeAttr("disabled").addClass("active");
          notificationParamRow.removeClass("disabled");
          notifStatusIcon.text("notifications_active").removeAttr("title").attr("data-original-title", "Notifications activées").addClass("active");
          isPushEnabled = true;
        } else {
          notificationParamRow.addClass("disabled");
        }
        break;

      case 'disabled':
        notifSwitch.removeClass("active disabled").removeAttr("disabled");
        notificationParamRow.removeClass("disabled");
        isPushEnabled = false;
        break;

      case 'computing':
        notifSwitch.addClass("disabled").attr("disabled", "true").before('<img src="src/assets/img/loader-info.svg" class="loader-notification" style="width: 24px">');
        notificationParamRow.addClass("disabled");
        break;

      case 'incompatible':
      case 'denied':
        notifSwitch.addClass("disabled").removeClass("active").attr("disabled", "true");

        notificationParamRow
          .removeClass("active").addClass("disabled").find('h6 .text').html("");
        notificationParamRow
          .find("h6 small").html('Les notifications ne sont pas compatibles avec ce navigateur');

      case 'denied':
        notificationParamRow.find("h6 small").html('Les notifications ont été désactivées.');
        break;

      default:
        console.error('Unhandled push button state', state);
        break;
    }
  }
  

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function checkNotificationPermission() {

    return new Promise((resolve, reject) => {
      if (Notification.permission === 'denied') {
        changeNotificationSwitchState('denied');
        return reject(new Error('Push messages are blocked.'));
      }

      if (Notification.permission === 'granted') {
        //changeNotificationSwitchState('enabled');
        return resolve();
      }

      if (Notification.permission === 'default') {
        return Notification.requestPermission().then(result => {
          if (result !== 'granted') {
            reject(new Error('Bad permission result'));
          }

          resolve();
        });
      }
    });
  }

  function push_subscribe() {
    changeNotificationSwitchState('computing');

    return checkNotificationPermission()
      .then(() => navigator.serviceWorker.ready)
      .then(serviceWorkerRegistration =>
        serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
        })
      )
      .then(subscription => {
        // Subscription was successful -> create subscription on the server
        return push_sendSubscriptionToServer(subscription, 'POST');
      })
      .then(subscription => subscription && changeNotificationSwitchState('enabled')) // update UI
      .catch(e => {
        if (Notification.permission === 'denied') {
          console.warn('Notifications are denied by the user.');
          changeNotificationSwitchState('incompatible');
        } else {
          // A problem occurred with the subscription; common reasons include network errors or the user skipped the permission
          console.error('Impossible to subscribe to push notifications', e);
          changeNotificationSwitchState('disabled');
        }
      });
  }

  function push_updateSubscription() {
    navigator.serviceWorker.ready
      .then(serviceWorkerRegistration => serviceWorkerRegistration.pushManager.getSubscription())
      .then(subscription => {
        changeNotificationSwitchState('disabled');

        if (!subscription) {
          // We aren't subscribed to push, so set UI to allow the user to enable push
          return;
        }
        
        // Keep your server in sync with the latest endpoint
        return push_sendSubscriptionToServer(subscription, 'PUT');
      })
      .then(subscription => subscription && changeNotificationSwitchState('enabled')) // Set your UI to show they have subscribed for push messages
      .catch(e => {
        console.error('Error when updating the subscription', e);
      });
  }

  function push_unsubscribe() {
    changeNotificationSwitchState('computing');

    // To unsubscribe from push messaging, you need to get the subscription object
    navigator.serviceWorker.ready
      .then(serviceWorkerRegistration => serviceWorkerRegistration.pushManager.getSubscription())
      .then(subscription => {
        // Check that we have a subscription to unsubscribe
        if (!subscription) {
          // No subscription object, so set the state to allow the user to subscribe to push
          changeNotificationSwitchState('disabled');
          return;
        }

        // We have a subscription, unsubscribe. Remove push subscription from server
        return push_sendSubscriptionToServer(subscription, 'DELETE');
      })
      .then(subscription => subscription.unsubscribe())
      .then(() => changeNotificationSwitchState('disabled'))
      .catch(e => {
        // We failed to unsubscribe, this can lead to an unusual state, so  it may be best to remove
        // the users data from your data store and inform the user that you have done so
        console.error('Error when unsubscribing the user', e);
        changeNotificationSwitchState('disabled');
      });
  }

  function push_sendSubscriptionToServer(subscription, method) {

    let bodyContent = {
      "subscription" : subscription,
      "ipv4" : localStorage.getItem("ip"),
      "couplingCode" : localStorage.getItem("coupling-code")
    };

    return fetch('src/subscription.php', {
      method,
      body: JSON.stringify(bodyContent)
    }).then(() => subscription);
  }

});
