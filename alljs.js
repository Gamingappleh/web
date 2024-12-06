var _____WB$wombat$assign$function_____ = function(name) {return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name)) || self[name]; };
if (!self.__WB_pmw) { self.__WB_pmw = function(obj) { this.__WB_source = obj; return this; } }
{
let window = _____WB$wombat$assign$function_____("window");
let globalThis = _____WB$wombat$assign$function_____("globalThis");
let self = _____WB$wombat$assign$function_____("self");
let document = _____WB$wombat$assign$function_____("document");
let location = _____WB$wombat$assign$function_____("location");
let top = _____WB$wombat$assign$function_____("top");
let parent = _____WB$wombat$assign$function_____("parent");
let frames = _____WB$wombat$assign$function_____("frames");
let opener = _____WB$wombat$assign$function_____("opener");
let arguments;

//Global var
var accountsObject = {} //Will contain all logged account information. Multi account capability.
var accountActive = undefined //Will contain the name (mostly email address) of the current active account
var apiServer = "api" //The hostname of the api server to use to interact with Gofile
var contentsDir = "/contents/" //The location of frontend pages
var entryPage = window.location.pathname //Contain the Path of the entry page of the user. Needed for software logic.
var urlSplit = window.location.pathname.split("/") //Split the path into an array. Needed for software logic.
var sidebarCollapseLevel = 2 //The sidebar collapse level.
var modal = undefined //The modal var required to construct, show and hide modal
var mainFolderObject = {} //Contain all information about the current displayed folder.
var pressedKeys = {}; //Contain pressed keys. Needed for some file manager logic.
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }
var random = new URLSearchParams(window.location.search).get('random') ? parseFloat("0." + new URLSearchParams(window.location.search).get('random')) : Math.random(); //Set the random value to the url param "random" if present, if not, generate random
var referrer = document.referrer //Contain referrer information of the user

//Vars for upload process
var uploadQueue = {} //Contain the queue of content that must be uploaded to Gofile server

//Vars for view process
var contentsSelected = {} //Contain content that is selected with the checkboxes in filemanager
var lastContentSelected = {} //Needed for some logic with the shift key in file manager to select multiple elements
lastContentSelected.id = undefined
lastContentSelected.checked = undefined
lastContentSelected.processing = false

//Vars for Profile page
var currencySelected = "USD" //Currency used for credit system

//Vars for API page
var prismLoaded = false

//Vars for ads
var galaksionScriptLoaded = false
var linkvertiseScriptLoaded = false
var clickaduScriptLoaded = false
var clickadu2ScriptLoaded = false
var mahiMetaScriptLoaded = false
var mustLoadGalaksion = false
var mustLoadLinkvertise = false
var mustLoadClickadu = false
var mustLoadClickadu2 = false
var mustLoadMahimeta = false

//Global list
var countriesArray = [] //Contain all selectable countries for payment form.

//Force specific api server
if (window.location.host.startsWith("eu")) {
  apiServer = "api-eu";
}
else if (window.location.host.startsWith("na")) {
  apiServer = "api-na";
}
else if (window.location.host.startsWith("ap")) {
  apiServer = "api-ap";
}
if (window.location.host.startsWith("dev-eu")) {
  apiServer = "api-eu-dev";
}
else if (window.location.host.startsWith("dev-na")) {
  apiServer = "api-na-dev";
}
else if (window.location.host.startsWith("dev-ap")) {
  apiServer = "api-ap-dev";
}

//Load dayjs plugin
dayjs.extend(window.dayjs_plugin_customParseFormat)

// Helper functions
function fade(element, fadeType, duration, callback) {
  var start = performance.now();
  var op = fadeType === 'out' ? 1 : 0;
  var timer = setInterval(function() {
    var elapsed = performance.now() - start;
    element.style.opacity = op + (fadeType === 'out' ? -1 : 1) * elapsed / duration;
    if (elapsed >= duration) {
      clearInterval(timer);
      element.style.opacity = op === 1 ? 0 : 1;
      if (callback) {
        callback();
      }
    }
  }, 1000/60);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getPremiumTrafficLastXDays(accountEmail, days) {
  var value = 0;
  var currentDate = new Date();
  for (var year in accountsObject[accountEmail].statsHistory ) {
    for (var month in accountsObject[accountEmail].statsHistory [year]) {
      for (var day in accountsObject[accountEmail].statsHistory [year][month]) {
        var dateToCompare = new Date(year, month - 1, day); // JavaScript Date months are 0-based
        var timeDiff = currentDate - dateToCompare;
        var daysFromData = timeDiff / (1000 * 3600 * 24); // Convert to days
        if (daysFromData < days) {
          value += accountsObject[accountEmail].statsHistory[year][month][day].trafficDirectGenerated+accountsObject[accountEmail].statsHistory[year][month][day].trafficReqDownloaded
        }
      }
    }
  }
  return value+accountsObject[accountEmail].statsCurrent.trafficDirectGenerated+accountsObject[accountEmail].statsCurrent.trafficReqDownloaded;
}

function humanFileSize(bytes, si) {
  var thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  var units = si ?
    ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] :
    ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
}

function toHHMMSS(secondsToFormat) {
  var sec_num = parseInt(secondsToFormat, 10); // don't forget the second param
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (hours < 10) { hours = "0" + hours; }
  if (minutes < 10) { minutes = "0" + minutes; }
  if (seconds < 10) { seconds = "0" + seconds; }
  return hours + ':' + minutes + ':' + seconds;
}

function validateEmail(email) {
  // http://stackoverflow.com/a/46181/11236
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function validateName(name) {
  var re = /^[a-z0-9\ ]{2,50}$/i;
  return re.test(name);
}

function validatePasswd(passwd) {
  var re = /^[a-z0-9]{4,100}$/i;
  return re.test(passwd);
}

function validateTags(tags) {
  var re = /^[a-z0-9,\-_]+$/i;
  return re.test(tags);
}

async function ping(serverUrl) {
  const start = performance.now(); // Start timing

  try {
    await fetch(serverUrl, { method: 'HEAD', cache: 'no-cache' });
    const end = performance.now(); // End timing
    const result = end - start; // Calculate ping time in ms
    console.log(`Ping time to ${serverUrl}: ${result} ms`);
    return result;
  } catch (error) {
    console.error(`Ping to ${serverUrl} failed:`, error);
    console.log(`Ping time to ${serverUrl}: 9999 ms (failed)`);
    return 9999; // Return 9999 if the ping fails
  }
}

// The sidebarCollapse function allows to toggle between different collapse levels of a sidebar in a responsive layout.
// It accepts an optional parameter 'collapseLevel' to explicitly set the collapse level.
function sidebarCollapse(collapseLevel) {
  var sidebar = document.querySelector("#sidebar");
  var toggleArrow = document.querySelector("#sidebar-toggle-arrow");

  if (collapseLevel === undefined) {
    sidebarCollapse(sidebarCollapseLevel === 0 ? 2 : 0);
  } else {
    toggleArrow.classList.remove("bi-arrow-right-short", "bi-arrow-left-short");
    sidebar.classList.remove("d-none", "d-flex");

    sidebarCollapseLevel = collapseLevel;
    if (collapseLevel === 0) {
      toggleArrow.classList.add("bi-arrow-right-short");
      sidebar.classList.add("d-none");
    } else {
      toggleArrow.classList.add(collapseLevel === 1 ? "bi-arrow-right-short" : "bi-arrow-left-short");
      sidebar.classList.add("d-flex");
      sidebar.style.maxWidth = collapseLevel === 1 ? "100px" : "250px";

      document.querySelectorAll(".sidebarMobile").forEach(function (element) {
        element.style.display = collapseLevel === 1 ? "none" : "block";
      });
    }

    var isSmallScreen = document.body.offsetWidth < 992 || document.getElementById("main").getBoundingClientRect().top > 0;
    sidebar.style.position = isSmallScreen ? "fixed" : "";
    sidebar.style.height = isSmallScreen ? "100vh" : "";
  }
}

// This function sets the active account and displays a toast notification if needed.
function setAccountActive(account, showToast) {
  if (account != accountActive && showToast) {
    createToast({
      toastIcon: "bi-exclamation-circle",
      toastTitle: "Account",
      toastHeaderColor: "text-bg-primary",
      toastBody: "Active account has been set to " + account
    });
  }

  var allSidebarAccountList = document.getElementById('sidebarAccountList');
  if (allSidebarAccountList) {
    var activeElements = allSidebarAccountList.querySelectorAll('.active');
    activeElements.forEach(function (element) {
      element.classList.remove('active');
    });
  }
  var sidebarAccountListActive = document.getElementById('sidebarAccountList_' + account);
  if (sidebarAccountListActive) {
    sidebarAccountListActive.children[0].classList.add('active');
  }

  accountActive = account;
  localStorage["accountActive"] = account;

  document.cookie = "accountToken=" + accountsObject[accountActive].token + ";path=/;domain=gofile.io;SameSite=Lax;Secure;";

  buildSidebarAccountList()
}

//Will select an active account by checking all connected account and choosing the highest tier one
function selectAccountActive(showToast) {
  var tierCheck, accountToSetActive;
  for (var account in accountsObject) {
    var tier = accountsObject[account].tier;
    if (!tierCheck || (tierCheck === "guest" && tier !== "guest") || (tierCheck === "standard" && (tier === "donor" || tier === "premium"))) {
      accountToSetActive = account;
      tierCheck = tier;
    }
  }
  setAccountActive(accountToSetActive, showToast);
}

// Custom fetch wrapper
async function myFetch(option) {
  try {
    if (!option.url) {
      return { status: "error", data: "myFetch missing URL" };
    }
    var fetchResult;
    if (!option.method || option.method == "GET") {
      fetchResult = await fetch(option.url, {
        headers: option.headers,
      });
    } else if (["POST", "PUT", "DELETE"].includes(option.method)) {
      const fetchOptions = {
        method: option.method,
        headers: option.headers,
      };
      if (option.data) {
        fetchOptions.body = JSON.stringify(option.data);
      }
      fetchResult = await fetch(option.url, fetchOptions);
    }

    if (fetchResult.status >= 500 && fetchResult.status < 600) {
      return { status: "error", data: fetchResult.statusText };
    }

    return await fetchResult.json();
  } catch (error) {
    return { status: "error", data: error.message };
  }
}

//DOM functions
function loadContent(url, htmlElement) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.text())
      .then(data => {
        htmlElement.innerHTML = data;
        resolve();
      })
      .catch(error => {
        htmlElement.innerHTML = '<div class="text-center"><i class="bi bi-exclamation-circle me-2 text-danger"></i>An error occurred while the page was loading. Please try again later.<br>' + error + '</div>';
        reject(error);
      });
  });
}
var modalTemplate = null;
function createModal(option) {
  if (modal) {
    modal.hide()
  }

  if (modalTemplate !== null) {
    modalTemplate.remove();
  }

  if (option == undefined) { var option = {} }

  if (option.modalFade == undefined) { option.modalFade = false }
  if (option.modalTitle == undefined) { option.modalTitle = "" }
  if (option.modalBody == undefined) { option.modalBody = "" }
  if (option.modalNoLabel == undefined) { option.modalNoLabel = "" }
  if (option.modalYesLabel == undefined) { option.modalYesLabel = "" }
  if (option.showCloseBtn == undefined) { option.showCloseBtn = true }
  if (option.isStatic == undefined) { option.isStatic = false }
  if (option.modalCallback == undefined) { option.modalCallback = function() {} }

  modalTemplate = document.createElement('div');
  modalTemplate.innerHTML = `
    <div class="modal fade" data-bs-backdrop="static" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
          <div class="modal-header p-2">
            <h5 class="modal-title">` + option.modalTitle + `</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ` + option.modalBody + `
          </div>
          <div class="modal-footer">
            <button id="modalNoLabel" type="button" class="btn btn-secondary" data-bs-dismiss="modal">` + option.modalNoLabel + `</button>
            <button id="modalYesLabel" type="button" class="btn btn-primary modal-success-btn" data-bs-dismiss="modal">` + option.modalYesLabel + `</button>
          </div>
        </div>
      </div>
    </div>
  `;
  if (option.modalFade != true) {
    modalTemplate.innerHTML = modalTemplate.innerHTML.replace('fade', '')
  }

  if (option.isStatic != true) {
    modalTemplate.innerHTML = modalTemplate.innerHTML.replace('data-bs-backdrop="static"', '')
  }

  if (option.showCloseBtn != true) {
    modalTemplate.innerHTML = modalTemplate.innerHTML.replace('<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>', '')
  }

  if (option.modalNoLabel == "" && option.modalYesLabel == "") {
    modalTemplate.innerHTML = modalTemplate.innerHTML.replace(/<div class="modal-footer">(.|\n)*?<\/div>/, '')
  }

  if (option.modalNoLabel == "") {
    modalTemplate.innerHTML = modalTemplate.innerHTML.replace(/<button id="modalNoLabel"(.|\n)*?<\/button>/, '')
  }

  if (option.modalYesLabel == "") {
    modalTemplate.innerHTML = modalTemplate.innerHTML.replace(/<button id="modalYesLabel"(.|\n)*?<\/button>/, '')
  }
  else {
    modalTemplate.querySelector('#modalYesLabel').onclick = option.modalCallback;
  }

  document.body.append(modalTemplate);
  modal = new bootstrap.Modal(modalTemplate.querySelector('.modal'));
  modal.show();
}

function createToast(option) {
  var toastIdRandom = Math.round(Math.random() * 1000000)
  if (option == undefined) { var option = {} }

  if (option.toastIcon == undefined) { option.toastIcon = "bi-exclamation-circle" }
  if (option.toastIconColor == undefined) { option.toastIconColor = "" } //text-primary
  if (option.toastTitle == undefined) { option.toastTitle = "Title" }
  if (option.toastHeaderColor == undefined) { option.toastHeaderColor = "text-bg-primary" }
  if (option.toastSubTitle == undefined) { option.toastSubTitle = "" }
  if (option.toastBody == undefined) { option.toastBody = "Body" }
  if (option.toastAutohide == undefined) { option.toastAutohide = "true" }

  toastTemplate = document.createElement('div');
  toastTemplate.innerHTML = `
    <div id="toast_` + toastIdRandom + `" class="toast" role="alert" data-bs-autohide=`+option.toastAutohide+`>
      <div class="toast-header ` + option.toastHeaderColor + `">
        <i class="bi ` + option.toastIcon + ` me-2 ` + option.toastIconColor + `"></i>
        <strong class="me-auto">` + option.toastTitle + `</strong>
        <small>` + option.toastSubTitle + `</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ` + option.toastBody + `
      </div>
    </div>
  `;

  document.querySelector("#toast-container_br").append(toastTemplate);
  var toast = new bootstrap.Toast(toastTemplate.querySelector('#toast_' + toastIdRandom));
  toast.show();
}

//Content page behavior
//All DOM click event
document.addEventListener('click', async function(event) {
  //Global
  const ajaxLinkClicked = event.target.closest('.ajaxLink');
  if (ajaxLinkClicked){
    event.preventDefault();
    //Close any active modal
    if (modal) {
      modal.hide()
    }
    //If the URL clicked doesnt need to load a page, we don't rewrite URL and don't call processURL
    if (ajaxLinkClicked.getAttribute("href") == "/logout") {
      return logout(ajaxLinkClicked.parentNode.parentNode.parentNode.getAttribute('id').replace('sidebarAccountList_',''));
    }
    if (ajaxLinkClicked.getAttribute("href").includes("/myProfile") || ajaxLinkClicked.getAttribute("href") == "/myFiles" || ajaxLinkClicked.getAttribute("href") == "/premium") {
      if (ajaxLinkClicked.classList.contains("dropdown-item")) { //If the request is for a specific account in the sidebar
        var account = ajaxLinkClicked.parentNode.parentNode.parentNode.getAttribute('id').replace('sidebarAccountList_','');
        setAccountActive(account,true);
      }
    }

    // Extract part after /d/ in the href and store in sessionStorage
    if (ajaxLinkClicked.classList.contains("keepParentHistory")) {
      let hrefContentId = ajaxLinkClicked.getAttribute("href").match(/\/d\/([^\/]+)/); // Use regular expression to extract content id
      if (hrefContentId && hrefContentId[1]) {
        sessionStorage.setItem(hrefContentId[1]+"_parentFolder", mainFolderObject.id);
      }
    }

    history.pushState(null, '', 'https://' + window.location.hostname + ajaxLinkClicked.getAttribute("href"));
    processURL();
  }
  const copyTextClicked = event.target.closest('.copyText');
  if (copyTextClicked) {
    var thisClicked = event.target;
    if(thisClicked.matches('.copyText') == false)
    {
      thisClicked = thisClicked.closest('.copyText');
    }
    try {
      await navigator.clipboard.writeText(thisClicked.getAttribute("data-copyText"));
      const tooltip = bootstrap.Tooltip.getInstance(thisClicked); // Returns a Bootstrap tooltip instance
      tooltip.setContent({ '.tooltip-inner': 'Copied <i class="bi bi-check"></i>' });
    } catch (error) {
      createToast({
        toastIcon: "bi-exclamation-circle",
        toastTitle: "Error",
        toastHeaderColor: "text-bg-danger",
        toastBody: "Copy not supported by your browser"
      });
    }
  }
  const cmpAcceptClicked = event.target.closest('#cmpAccept');
  if (cmpAcceptClicked) {
    localStorage['cmpAccepted'] = "true"
  }
  const setActiveClicked = event.target.closest('.setActive');
  if (setActiveClicked) {
    setAccountActive(setActiveClicked.dataset.account, true)
    processURL()
  }
  //Login
  var loginFormSendClicked = event.target.closest('#loginFormSend');
  if (loginFormSendClicked) {
    event.preventDefault();
    if (!validateEmail(document.querySelector('#loginFormEmail').value)) {
      return createModal({
        modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-danger"></i>The email address you entered is invalid</p></div>'
      });
    }

    var email = document.querySelector('#loginFormEmail').value;

    document.querySelector('#loginFormSend').classList.add("d-none");
    document.querySelector('#loginFormSendLoading').classList.remove("d-none");

    var createAccountResult = await myFetch({
      url: "https://" + apiServer + ".gofile.io/accounts",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: { email: email }
    });

    if (createAccountResult.status == "ok") {
      createModal({
        modalBody: '<div class="text-center"><p><i class="bi bi-check-circle me-2 text-success"></i>An email with a login link has been sent to ' + email + '</p><hr><p><small>Don\'t see the email? Be sure to check your spam folder. Please wait for a few minutes and try again.</small></p></div>'
      });
      document.querySelector('#loginFormEmail').value = '';
    }
    else {
      createModal({
        modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
        modalBody: JSON.stringify(createAccountResult)
      });
    }

    document.querySelector('#loginFormSend').classList.remove("d-none");
    document.querySelector('#loginFormSendLoading').classList.add("d-none");
  }
  //Profile
  var profileAccountChartClicked = event.target.closest('.profileAccountChart');
  if (profileAccountChartClicked) {
    var labels = [];
    var data = [];
    var lastDates = []; // keep track of last xx dates
    if (profileAccountChartClicked.id == "profileAccountStorageUsedHistory" || profileAccountChartClicked.id == "profileAccountPremiumTrafficHistory") {
      for (const year in accountsObject[accountActive].statsHistory) {
        for (const month in accountsObject[accountActive].statsHistory[year]) {
          for (const day in accountsObject[accountActive].statsHistory[year][month]) {
            if (profileAccountChartClicked.id == "profileAccountStorageUsedHistory") {
              var dataToPush = accountsObject[accountActive].statsHistory[year][month][day].storage;
            } else if (profileAccountChartClicked.id == "profileAccountPremiumTrafficHistory") {
              var dataToPush = accountsObject[accountActive].statsHistory[year][month][day].trafficDirectGenerated + accountsObject[accountActive].statsHistory[year][month][day].trafficReqDownloaded;
            }
            
            if(dataToPush != undefined) {
              const dateStr = `${year}-${month}-${day}`;
              labels.push(dateStr);
              data.push(dataToPush);
              lastDates.push(dateStr);
              if(lastDates.length > 30) {
                // remove oldest date from the list
                lastDates.shift();
                // remove oldest item from the labels and data arrays
                labels.shift();
                data.shift();
              }
            }
          }
        }
      }
    }
    else if (profileAccountChartClicked.id == "profileAccountCreditBalanceHistory") {
      for (const year in accountsObject[accountActive].creditConsumption) {
        for (const month in accountsObject[accountActive].creditConsumption[year]) {
          for (const day in accountsObject[accountActive].creditConsumption[year][month]) {
            var dataToPush = accountsObject[accountActive].creditConsumption[year][month][day].credit;
            if(dataToPush != undefined) {
              const dateStr = `${year}-${month}-${day}`;
              labels.push(dateStr);
              data.push(dataToPush);
              lastDates.push(dateStr);
              if(lastDates.length > 30) {
                // remove oldest date from the list
                lastDates.shift();
                // remove oldest item from the labels and data arrays
                labels.shift();
                data.shift();
              }
            }
          }
        }
      }
    }
    if(data.length > 0) {
      if(profileAccountChartClicked.id == "profileAccountStorageUsedHistory") {
        var datasets = [{
          label: 'Storage (bytes)',
          data: data,
        }]
      }
      else if (profileAccountChartClicked.id == "profileAccountPremiumTrafficHistory") {
        var datasets = [{
          label: 'Premium traffic (bytes)',
          data: data,
        }]
      }
      else if (profileAccountChartClicked.id == "profileAccountCreditBalanceHistory") {
        var datasets = [{
          label: 'Credit ($)',
          data: data,
        }]
      }
      createModal({
        modalBody: '<canvas id="modalChartCanvas"></canvas>'
      });
      const chart = new Chart(document.getElementById('modalChartCanvas').getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          scales: {
            x: {
  
            },
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
    else
    {
      createModal({
        modalBody: '<span>No data available</span>'
      });
    }
  }
  var profileAccountTokenResetClicked = event.target.closest('.profileAccountTokenReset');
  if (profileAccountTokenResetClicked) {
    return createModal({
      modalBody: `
        <div class="text-center">
          <p><i class="bi bi-exclamation-circle me-2 text-info"></i></p>
          <p>You are about to reset your account identification token, which will cause you to be logged out. A new login link will be sent to you.</p>
        </div>
      `,
      modalYesLabel: 'Reset token',
      modalCallback: async function() {
        createModal({
          showCloseBtn: false,
          isStatic: true,
          modalTitle: 'Loading ...',
          modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
        });
        var createAccountResult = await myFetch({
          url: "https://" + apiServer + ".gofile.io/accounts/" + accountsObject[accountActive].id + "/resettoken",
          method: "POST",
          headers: {
            "Authorization": "Bearer " + accountsObject[accountActive].token,
            "Content-Type": "application/json"
          }
        });
        if (createAccountResult.status == "ok") {
          createModal({
            modalBody:`
              <div class="text-center">
                <p><i class="bi bi-exclamation-circle me-2 text-success"></i></p>
                <p>Your token has been reset. A new login link has been sent to `+accountsObject[accountActive].email+`.</p>
              </div>
            `
          })
          logout(accountActive)
        }
        else {
          createModal({
            modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
            modalBody: JSON.stringify(createAccountResult)
          })
        }
      }
    });
  }
  //Files
  var filesUploadButtonClicked = event.target.closest('.filesUploadButton');
  if (filesUploadButtonClicked) {
    document.querySelector('#filesUploadInput').click();
  }
  var mainUploadCancelButtonClicked = event.target.closest('.mainUploadCancelButton');
  if (mainUploadCancelButtonClicked) {
    var uploadQueueUuid = event.target.closest('div[id^="mainUpload-"]').id.replace('mainUpload-', '')
    uploadQueue[uploadQueueUuid].state = "canceled"
  }
  var mainUploadCloseButtonClicked = event.target.closest('.mainUploadCloseButton');
  if (mainUploadCloseButtonClicked) {
    var uploadObjectDiv = event.target.closest('div[id^="mainUpload-"]')
    uploadObjectDiv.remove();

    if(!document.querySelector(".mainUploadUuid")) {
      document.querySelector("#mainContent").classList.remove("d-none")
    }
  }
  var filesSuccessShowBtnClicked = event.target.closest('#filesSuccessShowBtn');
  if(filesSuccessShowBtnClicked) {
    document.querySelector('#filesSuccess').classList.add('d-none');
    document.querySelector('#filesContent').classList.remove('d-none');
  }
  var filesErrorPasswordButtonClicked = event.target.closest('#filesErrorPasswordButton');
  if(filesErrorPasswordButtonClicked) {
    event.preventDefault();
    var urlSplit = window.location.pathname.split('/');
    sessionStorage['password|' + urlSplit[2]] = sha256(document.querySelector('#filesErrorPasswordInput').value);
    sessionStorage['password|' + mainFolderObject.id] = sha256(document.querySelector('#filesErrorPasswordInput').value);
    sessionStorage['nextReqCache'] = false;
    return processURL();
  }
  var filesUploadProgressCancelButtonClicked = event.target.closest('#filesUploadProgressCancelButton');
  if(filesUploadProgressCancelButtonClicked) {
    window.location.reload();
  }
  var filesContentToolbarCreateFolderClicked = event.target.closest('#filesContentToolbarCreateFolder');
  if(filesContentToolbarCreateFolderClicked) {
    createModal({
      modalTitle: '<i class="bi bi-folder-plus me-2"></i>Create folder',
      modalBody: `
        <div class="row">
          <div class="col">
            <label for="modalInput"><i class="bi bi-exclamation-circle me-2 text-info"></i>Enter folder name:</label>
            <input type="text" class="form-control mt-1" id="modalInput">
          </div>
        </div>
      `,
      modalYesLabel: '<i class="bi bi-folder-plus me-2"></i>Create',
      modalNoLabel: '<i class="bi bi-x-circle-fill me-2"></i>Cancel',
      modalCallback: async function() {
        let folderName = document.getElementById('modalInput').value;
        createModal({
          showCloseBtn: false,
          isStatic: true,
          modalTitle: 'Loading ...',
          modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
        });
        let createFolderResult = await myFetch({
          url: "https://" + apiServer + ".gofile.io/contents/createfolder",
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accountsObject[accountActive].token}`,
            "Content-Type": "application/json",
          },
          data: {
            parentFolderId: mainFolderObject.id,
            folderName: folderName
          }
        });

        if (createFolderResult.status !== "ok") {
          createModal({
            modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
            modalBody: JSON.stringify(createFolderResult)
          });
        } else {
          createModal({
            modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>The folder has been created</p></div>',
          });
          sessionStorage['nextReqCache'] = false;
          processURL();
        }
      }
    });
  }
  var filesContentToolbarSearchClicked = event.target.closest('#filesContentToolbarSearch');
  if(filesContentToolbarSearchClicked) {
    if (accountsObject[accountActive].tier != "donor" && accountsObject[accountActive].tier != "premium") {
      return createModal({
        modalTitle: 'Upgrade Account',
        modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-warning"></i>Advanced features are only available with a premium account. Upgrade your account to access these features.</p></div>',
        modalYesLabel: "Upgrade",
        modalNoLabel: "Cancel",
        modalCallback: function() {
          history.pushState(null, '', 'https://' + window.location.hostname + '/premium')
          processURL()
        }
      })
    }
    createModal({
      modalTitle: '<i class="bi bi-search me-2"></i>Search in folder <i class="bi bi-folder-fill text-warning"></i> '+mainFolderObject.name,
      modalBody: `
        <div class="row">
          <div class="col">
            <label for="modalInput"><i class="bi bi-exclamation-circle me-2 text-info"></i>Enter keyword to search (content name or tags)</label>
            <input type="text" class="form-control mt-1" id="modalInput">
          </div>
        </div>
      `,
      modalYesLabel: '<i class="bi bi-search me-2"></i>Search',
      modalNoLabel: '<i class="bi bi-x-circle-fill me-2"></i>Cancel',
      modalCallback: async function() {
        let searchedString = document.getElementById('modalInput').value;
        createModal({
          showCloseBtn: false,
          isStatic: true,
          modalTitle: 'Loading ...',
          modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
        });
        let searchResult = await myFetch({
          url: "https://" + apiServer + ".gofile.io/contents/search?contentId="+mainFolderObject.id+"&searchedString="+searchedString,
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accountsObject[accountActive].token}`,
            "Content-Type": "application/json",
          }
        });
        if (searchResult.status !== "ok") {
          createModal({
            modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
            modalBody: JSON.stringify(searchResult)
          });
        } else {
          createModal({
            modalTitle: `Search results for keyword '${searchedString}'`,
            modalBody: Object.values(searchResult.data).map(item => `
              <div class="card mb-3 position-relative">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <i class="bi ${item.type === 'folder' ? 'bi-folder-fill text-warning position-relative' : 'bi-file-earmark-fill'} me-2">
                        ${item.type === 'folder' ? `<small><span class="badge position-absolute top-0 start-100 translate-middle rounded-pill bg-secondary">${item.childrenCount}</span></small>` : ''}
                      </i>
                      <a class="ajaxLink" href="/d/${item.type === 'folder' ? item.id : item.parentFolder}">${item.name}</a>
                    </div>
                    <small class="text-muted">${new Date(item.createTime * 1000).toLocaleString()}</small>
                  </div>
                  ${item.type === 'file' ? `
                    <div class="mt-2">
                      <span class="badge bg-secondary"><i class="bi bi-hdd-fill me-1"></i>Size: ${humanFileSize(item.size, true)}</span>
                      <span class="badge bg-secondary"><i class="bi bi-download me-1"></i>Downloads: ${item.downloadCount}</span>
                    </div>` : `
                    <div class="mt-2">
                      <span class="badge bg-secondary"><i class="bi bi-hdd-fill me-1"></i>Total Size: ${humanFileSize(item.totalSize, true)}</span>
                    </div>`}
                </div>
              </div>
            `).join('')
          });                   
        }
      }
    });
  }
  var filesContentSortClicked = event.target.closest('.filesContentSort');
  if(filesContentSortClicked) {
    var clickedElement = event.target;
    sessionStorage.removeItem(mainFolderObject.id+'|sort');
    if (clickedElement.classList.contains("filesContentSortName")) {
      sessionStorage[mainFolderObject.id+'|sort'] = "Name";
    } else if (clickedElement.classList.contains("filesContentSortSize")) {
      sessionStorage[mainFolderObject.id+'|sort'] = "Size";
    } else if (clickedElement.classList.contains("filesContentSortDate")) {
      sessionStorage[mainFolderObject.id+'|sort'] = "Date";
    } else if (clickedElement.classList.contains("filesContentSortDownloads")) {
      sessionStorage[mainFolderObject.id+'|sort'] = "Downloads";
    } else if (clickedElement.classList.contains("filesContentSortType")) {
      sessionStorage[mainFolderObject.id+'|sort'] = "Type";
    }
    loadTableFromFolderResult(sessionStorage[mainFolderObject.id+'|sort']);
  }
  var filesContentToolbarCheckboxToggleClicked = event.target.closest('#filesContentToolbarCheckboxToggle');
  if(filesContentToolbarCheckboxToggleClicked) {
    const checkboxes = document.querySelectorAll('.filesContentCheckbox');
    if (Object.keys(contentsSelected).length == Object.keys(mainFolderObject.children).length) {
      checkboxes.forEach(checkbox => checkbox.checked = false);
      checkboxes.forEach(checkbox => checkbox.dispatchEvent(new Event('change', { bubbles: true })));
    }
    else {
      checkboxes.forEach(checkbox => checkbox.checked = true);
      checkboxes.forEach(checkbox => checkbox.dispatchEvent(new Event('change', { bubbles: true })));
    }
  }
  var filesContentToolbarDownloadClicked = event.target.closest('#filesContentToolbarDownload');
  if(filesContentToolbarDownloadClicked) {
    if(Object.keys(contentsSelected).length == 1 && mainFolderObject.children[Object.keys(contentsSelected)[0]].type == "file") {
      var tempLink = document.createElement("a");
      tempLink.setAttribute("href", mainFolderObject.children[Object.keys(contentsSelected)[0]].link);
      tempLink.click();
    } else {
      downloadBulkContents(Object.keys(contentsSelected).join(), mainFolderObject);
    }
    document.querySelectorAll('.filesContentCheckbox').forEach(function(element) {
      element.checked = false;
      element.dispatchEvent(new Event('change', {bubbles: true}));
    });
  }
  var filesContentToolbarCopyClicked = event.target.closest('#filesContentToolbarCopy');
  if(filesContentToolbarCopyClicked) {
    popupBeforeCopyContent(Object.keys(contentsSelected).join())
  }
  var filesContentToolbarCopyHereClicked = event.target.closest('#filesContentToolbarCopyHere');
  if(filesContentToolbarCopyHereClicked) {
    copyContent(sessionStorage.getItem('toCopy'), mainFolderObject)
  }
  var filesContentToolbarCancelCopyHereClicked = event.target.closest('#filesContentToolbarCancelCopyHere');
  if(filesContentToolbarCancelCopyHereClicked) {
    sessionStorage.removeItem('toCopy');
    document.querySelector("#filesContentToolbarCopyHere").classList.add("d-none");
    document.querySelectorAll(".filesContentOptionCopyHere").forEach(element => element.classList.add("d-none"));
    document.querySelector("#filesContentToolbarCancelCopyHere").classList.add("d-none");
  }
  var filesContentToolbarMoveClicked = event.target.closest('#filesContentToolbarMove');
  if(filesContentToolbarMoveClicked) {
    popupBeforeMoveContent(Object.keys(contentsSelected).join())
  }
  var filesContentToolbarMoveHereClicked = event.target.closest('#filesContentToolbarMoveHere');
  if(filesContentToolbarMoveHereClicked) {
    moveContent(sessionStorage.getItem('toMove'), mainFolderObject)
  }
  var filesContentToolbarCancelMoveHereClicked = event.target.closest('#filesContentToolbarCancelMoveHere');
  if(filesContentToolbarCancelMoveHereClicked) {
    sessionStorage.removeItem('toMove');
    document.querySelector("#filesContentToolbarMoveHere").classList.add("d-none");
    document.querySelectorAll(".filesContentOptionMoveHere").forEach(element => element.classList.add("d-none"));
    document.querySelector("#filesContentToolbarCancelMoveHere").classList.add("d-none");
  }
  var filesContentToolbarDeleteClicked = event.target.closest('#filesContentToolbarDelete');
  if(filesContentToolbarDeleteClicked) {
    deleteContent(Object.keys(contentsSelected).join())
  }
  var filesContentOptionDownloadAllClicked = event.target.closest('.filesContentOptionDownloadAll');
  if(filesContentOptionDownloadAllClicked) {
    downloadBulkContents(undefined, mainFolderObject)
  }
  var filesContentOptionPlayAllClicked = event.target.closest('.filesContentOptionPlayAll');
  if(filesContentOptionPlayAllClicked) {
    for (const key in mainFolderObject.children) {
      if (mainFolderObject.children.hasOwnProperty(key)) {
        var contentInfo = mainFolderObject.children[key]
        if(contentInfo.overloaded != true) {
          playFile(contentInfo, false);
        }
      }
    }
    document.querySelectorAll('.filesContentOptionPlayAll').forEach(element => {element.classList.add('d-none')});
    document.querySelectorAll('.filesContentOptionCloseAll').forEach(element => {element.classList.remove('d-none')});
  }
  var filesContentOptionCloseAllClicked = event.target.closest('.filesContentOptionCloseAll');
  if(filesContentOptionCloseAllClicked) {
    for (const key in mainFolderObject.children) {
      if (mainFolderObject.children.hasOwnProperty(key)) {
        var contentInfo = mainFolderObject.children[key]
        if(contentInfo.overloaded != true) {
          closeFile(contentInfo);
        }
      }
    }

    document.querySelectorAll('.filesContentOptionCloseAll').forEach(function(element) {element.classList.add('d-none')});
    document.querySelectorAll('.filesContentOptionPlayAll').forEach(function(element) {element.classList.remove('d-none')});
  }
  var filesContentOptionDownloadClicked = event.target.closest('.filesContentOptionDownload');
  if(filesContentOptionDownloadClicked) {
    contentId = event.target.closest("[data-contentId]").getAttribute("data-contentId");
    downloadBulkContents(undefined, mainFolderObject.children[contentId])
  }
  var filesContentOptionPlayClicked = event.target.closest('.filesContentOptionPlay');
  if(filesContentOptionPlayClicked) {
    var contentInfo = mainFolderObject.children[event.target.closest("[data-contentId]").getAttribute("data-contentId")]
    playFile(contentInfo,true)
  }
  var filesContentOptionCloseClicked = event.target.closest('.filesContentOptionClose');
  if(filesContentOptionCloseClicked) {
    var contentInfo = mainFolderObject.children[event.target.closest("[data-contentId]").getAttribute("data-contentId")]
    closeFile(contentInfo)
  }
  var filesContentOptionInfosClicked = event.target.closest('.filesContentOptionInfos');
  if (filesContentOptionInfosClicked) {
    var contentId = event.target.closest("[data-contentId]").getAttribute("data-contentId");
    var contentInfo = mainFolderObject.children[contentId] || mainFolderObject;
    showInfos(contentInfo);
  }
  var filesContentOptionSettingsClicked = event.target.closest('.filesContentOptionSettings');
  if(filesContentOptionSettingsClicked) {
    var contentId = event.target.closest("[data-contentId]").getAttribute("data-contentId");
    var contentInfo = mainFolderObject.children[contentId] || mainFolderObject;
    showSettings(contentInfo);
  }
  var filesContentOptionRenameClicked = event.target.closest('.filesContentOptionRename');
  if(filesContentOptionRenameClicked) {
    var contentId = event.target.closest("[data-contentId]").getAttribute("data-contentId");
    var contentInfo = mainFolderObject.children[contentId] || mainFolderObject;
    createModal({
      modalTitle: '<i class="bi bi-pencil-fill me-2"></i>Rename '+contentInfo.type,
      modalBody: `
        <div class="row">
          <div class="col">
            <label for="modalInput"><i class="bi bi-exclamation-circle me-2 text-info"></i>Enter new name:</label>
            <input type="text" class="form-control mt-1" id="modalInput" value="${contentInfo.name}">
          </div>
        </div>
      `,
      modalYesLabel: '<i class="bi bi-pencil-fill me-2"></i>Rename',
      modalNoLabel: '<i class="bi bi-x-circle-fill me-2"></i>Cancel',
      modalCallback: async function() {
        let newName = document.getElementById('modalInput').value;
        createModal({
          showCloseBtn: false,
          isStatic: true,
          modalTitle: 'Loading ...',
          modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
        });
        let updateResult = await myFetch({
          url: "https://" + apiServer + ".gofile.io/contents/" + contentId + "/update",
          method: "PUT",
          data: { attribute: "name", attributeValue: newName },
          headers: {
            'Authorization': `Bearer ${accountsObject[accountActive].token}`,
            'Content-Type': 'application/json'
          }
        });

        if (updateResult.status !== "ok") {
          createModal({
            modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
            modalBody: JSON.stringify(updateResult)
          });
        } else {
          createModal({
            modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>The '+contentInfo.type+' has been renamed</p></div>',
          });
          sessionStorage['nextReqCache'] = false
          processURL()
        }
      }
    });
  }
  var filesContentOptionCopyClicked = event.target.closest('.filesContentOptionCopy');
  if(filesContentOptionCopyClicked) {
    var contentId = event.target.closest("[data-contentId]").getAttribute("data-contentId");
    popupBeforeCopyContent(contentId)
  }
  var filesContentOptionCopyHereClicked = event.target.closest('.filesContentOptionCopyHere');
  if(filesContentOptionCopyHereClicked) {
    var contentId = event.target.closest("[data-contentId]").getAttribute("data-contentId");
    var contentInfo = mainFolderObject.children[contentId] || mainFolderObject;
    copyContent(sessionStorage.getItem('toCopy'), contentInfo)
  }
  var filesContentOptionMoveClicked = event.target.closest('.filesContentOptionMove');
  if(filesContentOptionMoveClicked) {
    var contentId = event.target.closest("[data-contentId]").getAttribute("data-contentId");
    popupBeforeMoveContent(contentId)
  }
  var filesContentOptionMoveHereClicked = event.target.closest('.filesContentOptionMoveHere');
  if(filesContentOptionMoveHereClicked) {
    var contentId = event.target.closest("[data-contentId]").getAttribute("data-contentId");
    var contentInfo = mainFolderObject.children[contentId] || mainFolderObject;
    moveContent(sessionStorage.getItem('toMove'), contentInfo)
  }
  var filesLinkClicked = event.target.closest('.contentLink');
  if(filesLinkClicked) {
    event.preventDefault();
    var contentId = event.target.closest("[data-contentId]").getAttribute("data-contentId");
    var contentInfo = mainFolderObject.children[contentId] || mainFolderObject;
    if (contentInfo.overloaded == true) {
      createModal({
        modalTitle: `
          <i class="bi bi-file-earmark-fill me-1"></i>
          <span class="text">${contentInfo.name}</span>
        `,
        modalBody: `
            <div class="text-center">
              <i class="bi bi-clock-history text-warning mb-3" style="font-size: 2rem;"></i>
              <h5 class="text-warning mb-4">Download Access Temporary Limited</h5>
              <p class="">
                The server <strong>${contentInfo.serverSelected}</strong> is currently handling a high volume of traffic. To ensure service quality, access to <strong>${contentInfo.name}</strong> is temporary limited.
              </p>
              <hr>
              <p class="my-3">
                Become a Premium member for uninterrupted, high-speed downloads - plus, you help support our platform!
              </p>
              <a href="javascript:void(0)" onclick="modal.hide(); history.pushState(null, '', 'https://' + window.location.hostname + '/premium'); processURL();" class="btn btn-warning btn-lg px-4">
                <i class="bi bi-star me-2"></i>Upgrade to Premium
              </a>
              <p class="mt-4 text-muted small">
                You can also retry later if you're not ready to upgrade. We appreciate your patience.
              </p>
            </div>
        `,
      });
    } else {
      var tempLink = document.createElement("a");
      tempLink.setAttribute("href", contentInfo.link);
      tempLink.click();
    }
  }
  var filesContentOptionShareClicked = event.target.closest('.filesContentOptionShare');
  if(filesContentOptionShareClicked) {
    var contentId = event.target.closest("[data-contentId]").getAttribute("data-contentId");
    var contentInfo = mainFolderObject.children[contentId] || mainFolderObject;
    showShare(contentInfo)
  }
  var filesContentOptionImportClicked = event.target.closest('.filesContentOptionImport');
  if(filesContentOptionImportClicked) {
    var contentId = event.target.closest("[data-contentId]").getAttribute("data-contentId");
    importContent(contentId)
  }
  var filesContentOptionDeleteClicked = event.target.closest('.filesContentOptionDelete');
  if(filesContentOptionDeleteClicked) {
    var contentId = event.target.closest("[data-contentId]").getAttribute("data-contentId");
    deleteContent(contentId)
  }
  var filesContentOptionReportClicked = event.target.closest('.filesContentOptionReport');
  if(filesContentOptionReportClicked) {
    //Process and clear localstorage report info
  	for (var i in localStorage)
    {
      if (i.match(/^report/))
      {
        if(dayjs().diff(new Date(localStorage[i]),'hours') > 1)
        {
        	localStorage.removeItem(i)
        }
      }
    }

  	if(localStorage['report_'+mainFolderObject.code] != undefined)
  	{
  		return createModal({
        modalTitle: '<i class="bi bi-exclamation-circle me-2 text-warning"></i>Already reported',
        modalBody: '<div class="text-center"><p>You have already reported this file. It will soon be checked by the moderation team.</p></div>'
      })
  	}

    createModal({
      modalTitle: '<i class="bi bi-flag-fill me-2"></i>Report inappropriate content',
      modalBody: `
        <form id="modalReportForm">
          <div class="form-group mb-2">
            <label for="modalReportType">Type of report:</label>
            <select class="form-control" id="modalReportType">
              <option value="copyright">Copyright infringement</option>
              <option value="other">Private content/Harassment</option>
              <option value="abuse">Child Abuse</option>
              <option value="spam">Terrorism</option>
              <option value="spam">Other</option>
            </select>
          </div>
          <div class="form-group mb-2">
            <label for="modalReportEmail">Your email:</label>
            <input type="email" class="form-control" id="modalReportEmail" placeholder="Enter a valid email">
            <small id="emailHelp" class="form-text text-muted">The moderation team may request more details about your report, so please make sure to enter a valid email address.</small>
          </div>
          <div class="form-group mb-2">
            <label for="modalReportDescription">Description:</label>
            <textarea class="form-control" id="modalReportDescription" rows="3" placeholder="Enter a description of the inappropriate content"></textarea>
            <small id="descriptionHelp" class="form-text text-muted">Please provide as much detail as possible so that your report can be properly reviewed.</small>
          </div>
        </form>
      `,
      modalNoLabel: '<i class="bi bi-x-circle-fill me-2"></i>Cancel',
      modalYesLabel: '<i class="bi bi-check-circle-fill me-2"></i>Submit',
      modalCallback: async function() {
        // Get the values of the form fields
        var reportType = document.querySelector('#modalReportType').value;
        var reportEmail = document.querySelector('#modalReportEmail').value;
        var reportDescription = document.querySelector('#modalReportDescription').value;

        if(validateEmail(reportEmail) != true)
        {
          return createModal({
            modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-danger"></i>Email address invalid</p></div>',
          })
        }
        else if(reportDescription.length == 0)
        {
          return createModal({
            modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-danger"></i>Description invalid</p></div>',
          })
        }

        createModal({
          showCloseBtn: false,
          isStatic: true,
          modalTitle: 'Loading ...',
          modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
        })

        var sendEmailResult = await myFetch({
          url: "https://"+apiServer+".gofile.io/sendEmail",
          method: "POST",
          data: {
            name: mainFolderObject.code,
            email: "contact@gofile.io",
            subject: "Report "+reportEmail+" "+reportType+" "+mainFolderObject.code,
            message: `Email: ${reportEmail}\nType: ${reportType}\nDescription: ${reportDescription}\nURL: https://gofile.io/d/`+mainFolderObject.code+`
            `
          },
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (sendEmailResult.status !== "ok") {
          return createModal({
            modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
            modalBody: JSON.stringify(sendEmailResult)
          });
        }

        createModal({
          modalTitle: '<i class="bi bi-exclamation-circle me-2 text-success"></i>Report sent',
          modalBody: `
            <p>Thank you for your report. The moderation team will review it as soon as possible and take the necessary actions if needed.</p>
          `
        });

        localStorage['report_'+mainFolderObject.code] = Date()
      }
    });
  }
  //Premium
  var premiumStep1NextClicked = event.target.closest('.premiumStep1Next');
  if(premiumStep1NextClicked) {
    event.preventDefault();

    document.querySelectorAll('.premiumStep1Next').forEach(element => element.classList.add("d-none"));
    document.querySelectorAll('.premiumStep1NextLoading').forEach(element => element.classList.remove("d-none"));

    if(premiumStep1NextClicked.getAttribute('data-premium-type') == "subscription") {
      var priceOptionSelected = document.querySelector('input[name="premiumSubscriptionPriceOptions"]:checked').value;
    } else {
      var priceOptionSelected = document.querySelector('input[name="premiumCreditTopupOptions"]:checked').value;
    }

    document.querySelector(".premiumStep1Next").setAttribute("data-premium-type", premiumStep1NextClicked.getAttribute('data-premium-type'));
    document.querySelector(".premiumStep1Next").setAttribute("data-price-selected", priceOptionSelected);

    if(premiumStep1NextClicked.getAttribute('data-premium-type') == "subscription" && priceOptionSelected == 9) {
      document.querySelectorAll('.premiumStep1Next').forEach(element => element.classList.remove("d-none"));
      document.querySelectorAll('.premiumStep1NextLoading').forEach(element => element.classList.add("d-none"));
      var modalBody = `
      <div class="text-center"><span><i class="bi bi-exclamation-circle text-info"></i></span></div>
      <div class="text-center">
        <span>You are about to subscribe to Gofile Premium via the Patreon platform.</span><br>
        <span>When subscribing to Gofile from Patreon, use the same email address as on Gofile.</span><br><br>
        <span>Once your subscription on Patreon is activated, your account will be automatically upgraded shortly. You will receive a confirmation email from Gofile once this process is complete.</span>
      </div>
      <hr>
      <div class="text-center"><button id="premiumSubscriptionSubscribeBtnPatreon" class="btn btn-outline-secondary text-white">Subscribe<br><span class="text-muted"><small>9$/month via Patreon</small></span></button></div>
      `;
      createModal({
          modalBody: modalBody
      });
      document.querySelector('#premiumSubscriptionSubscribeBtnPatreon').addEventListener('click', async function(event) {
        window.open('https://www.patreon.com/gofile/membership', '_blank');
      })
      return
    }

    if(accountsObject[accountActive].tier == "guest")
    {
      var modalBody = `
      <div class="text-center"><span><i class="bi bi-exclamation-circle text-info"></i></span></div>
      <div class="text-center">
        <span>You are currently logged in as a guest.</span><br>
        <span>Login with your email address to upgrade your account to premium.</span>
      </div>
      <hr>
      <div class="text-center"><a href="/login" class="ajaxLink"><button class="btn btn-outline-secondary text-white">Login</button></a></div>
      `;
      return createModal({
          modalBody: modalBody
      });
    }

    if(countriesArray.length == 0)
    {
      //Get countries list and fill premiumStep2Country
      var result = await myFetch({
        url: "https://"+apiServer+".gofile.io/getCountries",
        method: "GET"
      });
      if(result.status != "ok")
      {
        return alert("error countries");
      }
      countriesArray = result.data
    }

    const select = document.querySelector(".premiumStep2Country");
    select.innerHTML = '<option value="">Select a country</option>'
    for (var i = 0; i < countriesArray.length; i++) {
      const option = document.createElement("option");
      option.value = countriesArray[i].code;
      option.text = countriesArray[i].name;
      select.appendChild(option);
    }

    document.querySelector(".premiumStep2Email").value = accountsObject[accountActive].email;
    document.querySelector(".premiumStep1").classList.add("d-none");
    document.querySelector(".premiumStep2").style.opacity = 0;
    document.querySelector(".premiumStep2").classList.remove("d-none");
    fade(document.querySelector(".premiumStep2"), 'in', 200, null);
  }
  var premiumStep2BackBtnClicked = event.target.closest('.premiumStep2BackBtn');
  if(premiumStep2BackBtnClicked) {
    document.querySelectorAll('.premiumStep1Next').forEach(element => element.classList.remove("d-none"));
    document.querySelectorAll('.premiumStep1NextLoading').forEach(element => element.classList.add("d-none"));

    document.querySelector(".premiumStep2").classList.add("d-none");
    document.querySelector(".premiumStep1").style.opacity = 0;
    document.querySelector(".premiumStep1").classList.remove("d-none");
    fade(document.querySelector(".premiumStep1"), 'in', 200, null);
  }
  var premiumStep2NextClicked = event.target.closest('.premiumStep2Next');
  if(premiumStep2NextClicked) {
    event.preventDefault();
    //Check if the form has been correctly filled
    var priceOptionSelected = parseInt(document.querySelector(".premiumStep1Next").getAttribute("data-price-selected"))
    var premiumStep2ClientType = "Individual"
    var premiumStep2PremiumType = document.querySelector(".premiumStep1Next").getAttribute("data-premium-type")
    var premiumStep2Email = accountsObject[accountActive].email
    var premiumStep2Firstname = document.querySelector('.premiumStep2Firstname').value;
    var premiumStep2Lastname = document.querySelector('.premiumStep2Lastname').value;
    var premiumStep2Country = document.querySelector('.premiumStep2Country').value;

    if (!validateEmail(premiumStep2Email) || !/^.{1,50}$/.test(premiumStep2Firstname) || !/^.{1,50}$/.test(premiumStep2Lastname) || !/^.{1,50}$/.test(premiumStep2Country)) {
      return alert("Invalid user information");
    }

    var createinvoicePendingResult = await myFetch({
      url: "https://" + apiServer + ".gofile.io/createinvoicePending",
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        email: premiumStep2Email,
        clientType: premiumStep2ClientType,
        premiumType: premiumStep2PremiumType,
        firstname: premiumStep2Firstname,
        lastname: premiumStep2Lastname,
        country: premiumStep2Country,
        premiumPriceSelected: priceOptionSelected,
        currency: currencySelected
      }
    });

    document.querySelector('.premiumStep2Next').classList.add("d-none");
    document.querySelector('.premiumStep2NextLoading').classList.remove("d-none");

    console.log(createinvoicePendingResult)
    if(createinvoicePendingResult.status != "ok")
    {
      alert("An error has occurred. Please try again later. If the issue persists, please contact us.");
      return window.location.reload()
    }

    var currencySign = "$";
    if (currencySelected === "EUR") {
      currencySign = "€";
    }

    document.querySelector(".premiumStep2Next").setAttribute("data-invoice-id", createinvoicePendingResult.data.id);
    document.querySelector(".premiumStep2Next").setAttribute("data-priceFinalVAT", createinvoicePendingResult.data.priceFinalVAT);

    document.querySelectorAll(".premiumPriceFinal").forEach(element => {
      element.innerHTML = createinvoicePendingResult.data.priceFinal + currencySign;
    });
    document.querySelectorAll(".premiumPriceCountryVatBefore").forEach(element => {
      element.innerHTML = "("+premiumStep2Country+" "+createinvoicePendingResult.data.priceVatRate*100+"%)";
    });
    document.querySelectorAll(".premiumPriceCountryVat").forEach(element => {
      element.innerHTML = createinvoicePendingResult.data.priceVat+currencySign;
    });
    document.querySelectorAll(".premiumPriceFinalVAT").forEach(element => {
      element.innerHTML = createinvoicePendingResult.data.priceFinalVAT + currencySign;
    });

    document.querySelector(".premiumStep2").classList.add("d-none");
    document.querySelector(".premiumStep3").style.opacity = 0;
    document.querySelector(".premiumStep3").classList.remove("d-none");
    fade(document.querySelector(".premiumStep3"), 'in', 200, null);
  }
  var premiumStep3BackBtn = event.target.closest('.premiumStep3BackBtn');
  if(premiumStep3BackBtn) {
    window.location.reload()
  }
  var premiumStep3PaypalBtn = event.target.closest('.premiumStep3PaypalBtn');
  if(premiumStep3PaypalBtn) {
    //Generate Paypal behavior
    var adScript = document.createElement('script');
    adScript.setAttribute('src','https://www.paypal.com/sdk/js?client-id=AUMhhKZsCLPzu-hHyF3nJWi3lCCmicQuLCxXPNrviw239k1_i1v9F1r1OOQKkrzu1y_JNUNEYx_0y3dv&currency='+currencySelected);
    document.head.appendChild(adScript);

    createModal({
      modalBody: `
      <div class="text-center">
        Click on the Paypal button below
        <div id="premiumStep3PaypalDiv" class="mt-2"></div>
      </div>
      `,
      modalYesLabel: "Cancel",
      showCloseBtn: false,
      isStatic: true,
      modalCallback: function() {
        window.location.reload()
      }
    })

    var failCounter = 0
    while(window.paypal == undefined && failCounter < 100)
    {
        failCounter++
        await sleep(100)
    }
    if(failCounter < 100)
    {
      alert(parseFloat(document.querySelector(".premiumStep2Next").getAttribute("data-priceFinalVAT")))
      paypal.Buttons({
        fundingSource: paypal.FUNDING.PAYPAL,
        style: {
          //color: 'black',
          //tagline: false,
          //height: 55,
        },
        createOrder: (data, actions) => {
          return actions.order.create({
            "purchase_units": [{
                amount: {
                  "value": parseFloat(document.querySelector(".premiumStep2Next").getAttribute("data-priceFinalVAT"))
                },
                custom_id: document.querySelector(".premiumStep2Next").getAttribute("data-invoice-id")
              }],
              application_context: {
                shipping_preference: 'NO_SHIPPING'
              }
          });
        },
        onApprove: (data, actions) => {
          return actions.order.capture().then(function(orderData) {
            console.log('Capture result', orderData, JSON.stringify(orderData, null, 2));
            return window.location.href = "https://" + window.location.hostname + "/payment#success";
          });
        }
      }).render('#premiumStep3PaypalDiv');
    }
  }
  var premiumStep3CreditCardBtn = event.target.closest('.premiumStep3CreditCardBtn');
  if(premiumStep3CreditCardBtn) {
    document.querySelector('.premiumStep3CreditCardBtn').classList.add("d-none");
    document.querySelector('.premiumStep3CreditCardBtnLoading').classList.remove("d-none");

    // var createPaymentRapydResult = await myFetch({
    //   url: "https://" + apiServer + ".gofile.io/createPaymentRapyd",
    //   method: "POST",
    //   data: {
    //     invoiceId: document.querySelector("#premiumStep3InvoiceId").innerHTML
    //   }
    // });
    // if(createPaymentRapydResult.status != "ok" || createPaymentRapydResult.data.redirect_url == undefined)
    // {
    //   alert("This payment method is not available in your country. Please choose another payment method. If the issue persists, please contact us.");
    //   return window.location.href = "https://" + window.location.hostname + "/";
    // }
    // var redirectUrl = createPaymentRapydResult.data.redirect_url

    // var createPaymentCCbillResult = await myFetch({
    //   url: "https://" + apiServer + ".gofile.io/createPaymentCCbill",
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json"
    //   },
    //   data: {
    //     invoiceId: document.querySelector(".premiumStep2Next").getAttribute("data-invoice-id")
    //   }
    // });
    // if(createPaymentCCbillResult.status != "ok" || createPaymentCCbillResult.paymentUrl == undefined)
    // {
    //   alert("This payment method is not available. Please choose another payment method. If the issue persists, please contact us.");
    //   return window.location.reload();
    // }
    // var redirectUrl = createPaymentCCbillResult.paymentUrl

    var createPaymentStripeResult = await myFetch({
      url: "https://" + apiServer + ".gofile.io/createPaymentStripe",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        invoiceId: document.querySelector(".premiumStep2Next").getAttribute("data-invoice-id")
      }
    });
    if(createPaymentStripeResult.status != "ok" || createPaymentStripeResult.paymentUrl == undefined)
    {
      alert("This payment method is not available. Please choose another payment method. If the issue persists, please contact us.");
      return window.location.reload();
    }
    var redirectUrl = createPaymentStripeResult.paymentUrl

    createModal({
      modalBody: `
      <div class="text-center">
        Please complete your payment by clicking on the button below.
      </div>
      <div class="text-center mt-3">
        <a href="${redirectUrl}" target="_blank"><button class="btn btn-outline-secondary text-white">Go to payment page</button></a>
      </div>
      <div class="text-center mt-3">
        Once you have made your payment, you can close this page.
      </div>
      `,
      modalYesLabel: "Close",
      showCloseBtn: false,
      isStatic: true,
      modalCallback: function() {
        return window.location.reload();
      }
    })
  }
  var premiumStep3CryptoBtn = event.target.closest('.premiumStep3CryptoBtn');
  if(premiumStep3CryptoBtn) {
    document.querySelector('.premiumStep3CryptoBtn').classList.add("d-none");
    document.querySelector('.premiumStep3CryptoBtnLoading').classList.remove("d-none");

    var createPaymentBtcpayResult = await myFetch({
      url: "https://" + apiServer + ".gofile.io/createPaymentBtcpay",
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        invoiceId: document.querySelector(".premiumStep2Next").getAttribute("data-invoice-id")
      }
    });

    if(createPaymentBtcpayResult.status != "ok" || createPaymentBtcpayResult.data.checkoutLink == undefined)
    {
      alert("This payment method is not available in your country. Please choose another payment method.");
      return window.location.reload();
    }

    var redirectUrl = createPaymentBtcpayResult.data.checkoutLink

    createModal({
      modalBody: `
      <div class="text-center">
        Please complete your payment by clicking on the button below.
      </div>
      <div class="text-center mt-3">
        <a href="${redirectUrl}" target="_blank"><button class="btn btn-outline-secondary text-white">Go to payment page</button></a>
      </div>
      <div class="text-center mt-3">
        Once you have made your payment, you can close this page.
      </div>
      `,
      modalYesLabel: "Close",
      showCloseBtn: false,
      isStatic: true,
      modalCallback: function() {
        return window.location.reload();
      }
    })
  }
  // var premiumStepCancelBtnClicked = event.target.closest('.premiumStepCancelBtn');
  // if(premiumStepCancelBtnClicked) {
  //   window.location.reload()
  // }

  //Contact
  var contactFormSendClicked = event.target.closest('#contactFormSend');
  if (contactFormSendClicked) {
    event.preventDefault();

    if (!validateName(document.querySelector("#contactFormName").value)) {
      return createModal({
        modalFade: false,
        modalBody: '<div class="text-center"><i class="bi bi-exclamation-circle me-2 text-danger"></i>Name invalid</div>'
      });
    }

    if (!validateEmail(document.querySelector("#contactFormEmail").value)) {
      return createModal({
        modalFade: false,
        modalBody: '<div class="text-center"><i class="bi bi-exclamation-circle me-2 text-danger"></i>Email address invalid</div>'
      });
    }

    if (document.querySelector('#contactFormMessage').value == '') {
      return createModal({
        modalFade: false,
        modalBody: '<div class="text-center"><i class="bi bi-exclamation-circle me-2 text-danger"></i>Message invalid</div>'
      });
    }

    const name = document.querySelector('#contactFormName').value;
    const email = document.querySelector('#contactFormEmail').value;
    const message = document.querySelector('#contactFormMessage').value;

    document.querySelector('#contactFormSend').classList.add('d-none');
    document.querySelector('#contactFormSendLoading').classList.remove('d-none');

    var sendEmailResult = await myFetch({
      url: "https://" + apiServer + ".gofile.io/sendEmail",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        name: name,
        email: email,
        subject: "Contact",
        message: message
      }
    });

    if (sendEmailResult.status == "ok") {
      createModal({
        modalBody: '<div class="text-center"><i class="bi bi-check-circle me-2 text-success"></i>Your message has been sent</div>'
      });
      document.getElementById('contactFormName').value = '';
      document.getElementById('contactFormEmail').value = '';
      document.getElementById('contactFormMessage').value = '';
    } else {
      createModal({
        modalBody: '<div class="text-center"><i class="bi bi-exclamation-circle me-2 text-danger"></i>Error when sending your message<br>' + JSON.stringify(sendEmailResult) + '</div>'
      });
    }

    document.getElementById("contactFormSend").classList.remove("d-none");
    document.getElementById("contactFormSendLoading").classList.add("d-none");
  }
  //Other
  var appLixirPremiumBtnClicked = event.target.closest('.appLixirPremiumBtn');
  if(appLixirPremiumBtnClicked) {
    modal.hide()
    history.pushState(null, '', 'https://' + window.location.hostname + '/premium');
    processURL();
  }
});
//All DOM input event
document.body.addEventListener('input', async function(event) {
  //MyProfile Sub
  if (event.target.matches('#profilePremiumRangeInput')) {
    var subValue = 5;
    var subLink = "https://www.patreon.com/join/gofile/checkout?rid=5163733";
    if (event.target.value == 0) {
      subValue = 5;
      subLink = "https://www.patreon.com/join/gofile/checkout?rid=5163733";
    } else if (event.target.value == 1) {
      subValue = 10;
      subLink = "https://www.patreon.com/join/gofile/checkout?rid=4638641";
    } else if (event.target.value == 2) {
      subValue = 20;
      subLink = "https://www.patreon.com/join/gofile/checkout?rid=7487532";
    } else if (event.target.value == 3) {
      subValue = 50;
      subLink = "https://www.patreon.com/join/gofile/checkout?rid=7491795";
    } else if (event.target.value == 4) {
      subValue = 100;
      subLink = "https://www.patreon.com/join/gofile/checkout?rid=8109976";
    }

    if (event.target.value != 5) {
      document.querySelector('#profilePremiumDetails').style.display = "";
      document.querySelector('#profilePremiumLink').style.display = "";
      document.querySelector('#profilePremiumLinkContactUs').style.display = "none";
      document.querySelectorAll('.profilePremiumDollars').forEach(element => element.innerHTML = subValue + "$");
      document.querySelector('#profilePremiumStorage').innerHTML = (100 * subValue) + " GB";
      document.querySelector('#profilePremiumFiles').innerHTML = (2000 * subValue) + " files";
      document.querySelector('#profilePremiumDDL').innerHTML = (200 * subValue) + " GB";
      document.querySelector('#profilePremiumLink > a').setAttribute("href", subLink);
    }
    else
    {
      document.querySelector('.profilePremiumDollars').innerHTML = "Contact us";
      document.querySelector('#profilePremiumDetails').style.display = "none";
      document.querySelector('#profilePremiumLink').style.display = "none";
      document.querySelector('#profilePremiumLinkContactUs').style.display = "";
    }
  }
  else if (event.target.matches('#filesContentToolbarFilterInput')) {
    loadTableFromFolderResult(sessionStorage[mainFolderObject.id+'|sort'],event.target.value)
  }
})
//All DOM change event
document.addEventListener('change', async function(event) {
  if (event.target.matches('#filesUploadInput')) {
    addFilesToUploadQueue(event.target.files)
  }
  else if (event.target.matches('.filesContentCheckbox')) {
    var contentId = event.target.closest(".contentId").id;
    if (event.target.checked) {
      contentsSelected[contentId] = true;
    } else {
      delete contentsSelected[contentId];
    }

    if (pressedKeys[16] == true && lastContentSelected.processing == false && lastContentSelected.id && document.getElementById(lastContentSelected.id) != null) { //Shift key
    lastContentSelected.processing = true;

    // Must get position of lastContentSelected
    var lastIndex = Array.prototype.indexOf.call(document.querySelectorAll("#filesContentTableContent > .contentId"), document.getElementById(lastContentSelected.id));
    // Must get position of current clicked box
    var index = Array.prototype.indexOf.call(document.querySelectorAll("#filesContentTableContent > .contentId"), document.getElementById(contentId));

    while (index != lastIndex) {
      document.querySelectorAll("#filesContentTableContent > .contentId")[index].querySelector(".filesContentCheckbox").checked = lastContentSelected.checked;
      document.querySelectorAll("#filesContentTableContent > .contentId")[index].querySelector(".filesContentCheckbox").dispatchEvent(new Event('change', { bubbles: true }));
      // Get loop direction
      if (index > lastIndex) {
        index--;
      }
      else {
        index++;
      }
    }
    lastContentSelected.processing = false;
    }
    else {
      lastContentSelected.id = contentId;
      lastContentSelected.checked = event.target.checked;
    }

    document.querySelector("#filesContentToolbarCheckboxToggleCount").innerHTML = Object.keys(contentsSelected).length;
    if (Object.keys(contentsSelected).length > 0) {
    if (Object.keys(contentsSelected).length == Object.keys(mainFolderObject.children).length) {
    document.querySelector("#filesContentToolbarCheckboxToggle").checked = true;
    } else {
    document.querySelector("#filesContentToolbarCheckboxToggle").checked = false;
    }

    document.querySelector("#filesContentToolbarCheckboxToggleCount").classList.remove("d-none");

    document.querySelector("#filesContentToolbarDownload").classList.remove("d-none");
    if (mainFolderObject.isOwner == true || accountsObject[accountActive].isCleaner) {
    document.querySelector("#filesContentToolbarDelete").classList.remove("d-none");
    document.querySelector("#filesContentToolbarCopy").classList.remove("d-none");
    document.querySelector("#filesContentToolbarMove").classList.remove("d-none");
    }
    } else {
    document.querySelector("#filesContentToolbarCheckboxToggle").checked = false;

    document.querySelector("#filesContentToolbarCheckboxToggleCount").classList.add("d-none");

    document.querySelector("#filesContentToolbarDownload").classList.add("d-none");
    document.querySelector("#filesContentToolbarCopy").classList.add("d-none");
    document.querySelector("#filesContentToolbarMove").classList.add("d-none");
    document.querySelector("#filesContentToolbarDelete").classList.add("d-none");
    }
  }
});

//Drag and Drop behavior
document.addEventListener("dragover", function(event) {
  event.preventDefault();
  event.stopPropagation();
});
document.addEventListener("dragleave", function(event) {
    event.preventDefault();
    event.stopPropagation();
});
document.addEventListener("drop", async function(event) {
  event.preventDefault();
  event.stopPropagation();

  if(event.dataTransfer.files.length == 0) {
    return;
  }

  addFilesToUploadQueue(event.dataTransfer.files)
});

//Other
window.onbeforeunload = function() {
  if(document.querySelector(".mainUploadUuid")) {
    return "Are you sure ?";
  }
};

//Blockies icon functions
! function() {
  function e(e) { for (var o = 0; o < c.length; o++) c[o] = 0; for (var o = 0; o < e.length; o++) c[o % 4] = (c[o % 4] << 5) - c[o % 4] + e.charCodeAt(o) }

  function o() { var e = c[0] ^ c[0] << 11; return c[0] = c[1], c[1] = c[2], c[2] = c[3], c[3] = c[3] ^ c[3] >> 19 ^ e ^ e >> 8, (c[3] >>> 0) / (1 << 31 >>> 0) }

  function r() { var e = Math.floor(360 * o()),
      r = 60 * o() + 40 + "%",
      t = 25 * (o() + o() + o() + o()) + "%",
      l = "hsl(" + e + "," + r + "," + t + ")"; return l }

  function t(e) { for (var r = e, t = e, l = Math.ceil(r / 2), n = r - l, a = [], c = 0; t > c; c++) { for (var i = [], f = 0; l > f; f++) i[f] = Math.floor(2.3 * o()); var s = i.slice(0, n);
      s.reverse(), i = i.concat(s); for (var h = 0; h < i.length; h++) a.push(i[h]) } return a }

  function l(o) { var t = {}; return t.seed = o.seed || Math.floor(Math.random() * Math.pow(10, 16)).toString(16), e(t.seed), t.size = o.size || 8, t.scale = o.scale || 4, t.color = o.color || r(), t.bgcolor = o.bgcolor || r(), t.spotcolor = o.spotcolor || r(), t }

  function n(e, o) { var r = t(e.size),
      l = Math.sqrt(r.length);
    o.width = o.height = e.size * e.scale; var n = o.getContext("2d");
    n.fillStyle = e.bgcolor, n.fillRect(0, 0, o.width, o.height), n.fillStyle = e.color; for (var a = 0; a < r.length; a++)
      if (r[a]) { var c = Math.floor(a / l),
          i = a % l;
        n.fillStyle = 1 == r[a] ? e.color : e.spotcolor, n.fillRect(i * e.scale, c * e.scale, e.scale, e.scale) }
    return o }

  function a(e) { var e = l(e || {}),
      o = document.createElement("canvas"); return n(e, o), o } var c = new Array(4),
    i = { create: a, render: n }; "undefined" != typeof module && (module.exports = i), "undefined" != typeof window && (window.blockies = i)
}();

const ro = new ResizeObserver((entries) => {
  if (document.body.offsetWidth < 992 || document.getElementById("main").getBoundingClientRect().top > 0) {
    document.querySelector("#sidebar").style.position = "fixed";
    document.querySelector("#sidebar").style.height = "100vh";
  }
});
ro.observe(document.body);

//Main app functions
async function processURL() {
  //Remove all success upload window
  document.querySelectorAll('.mainUploadUuid').forEach(function(element) {
    if(element.querySelector(".mainUploadClose").classList.contains("d-none") == false)
    {
      element.remove()
    }
  });
  //Display mainContent div in case it has been hidden by some upload mechanism
  document.querySelector("#mainContent").classList.remove("d-none")

  //Hide all divs ads
  document.querySelectorAll(".divpb").forEach(element => {
    element.classList.add("d-none");
  });

  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = '<div class="row h-100 justify-content-center align-items-center"><div class="col-auto"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div></div>';

  if (document.querySelector("#sidebar").style.position == "fixed") {
    sidebarCollapse(0);
  }

  urlSplit = window.location.pathname.split("/");
  if(urlSplit[1] === "") {
    history.replaceState(null, '', 'https://'+window.location.hostname+'/welcome');
    return processURL();
  }
  else if(urlSplit[1] === "welcome") {
    await loadContent(contentsDir+"welcome.html", mainContent);
    afterPageWelcomeLoad()
  }
  else if(urlSplit[1] === "myFiles") {
    history.replaceState(null, '', 'https://'+window.location.hostname+'/d/'+accountsObject[accountActive].rootFolder);
    return processURL();
  }
  else if(urlSplit[1] === "uploadFiles") {
    await loadContent(contentsDir+"files.html", mainContent);
    afterPageFilesLoad()
  }
  else if(urlSplit[1] === "d") {
    await loadContent(contentsDir+"files.html", mainContent);
    afterPageFilesLoad()
  }
  else if (urlSplit[1] === "myProfile") {
    await loadContent(contentsDir+"myProfile.html", mainContent);
    afterPageProfileLoad()
  }
  else if (urlSplit[1] === "api"){
    await loadContent(contentsDir+"api.html", mainContent);
    afterPageApiLoad()
  }
  else if (urlSplit[1] === "premium"){
    await loadContent(contentsDir+"premium.html", mainContent);
    afterPagePremiumLoad()
  }
  else if (urlSplit[1] === "contact") {
    await loadContent(contentsDir+"contact.html", mainContent);
    afterPageContactLoad()
  }
  else if (urlSplit[1] === "test") {
    await loadContent(contentsDir+"test.html", mainContent);
    afterPageTestLoad()
  }
  else {
    await loadContent(contentsDir+urlSplit[1]+".html", mainContent);
  }

  if (accountsObject[accountActive].tier == "guest") {
    document.querySelectorAll(".showGuest").forEach(function(el) {el.classList.remove("d-none")});
    document.querySelectorAll(".hideGuest").forEach(function(el) {el.classList.add("d-none")});
  }
  else if(accountsObject[accountActive].tier == "standard") {
    document.querySelectorAll(".showStandard").forEach(function(el) {el.classList.remove("d-none")});
    document.querySelectorAll(".hideStandard").forEach(function(el) {el.classList.add("d-none")});
  }
  else if(accountsObject[accountActive].tier == "donor" || accountsObject[accountActive].tier == "premium") {
    document.querySelectorAll(".showDonor").forEach(function(el) {el.classList.remove("d-none")});
    document.querySelectorAll(".hideDonor").forEach(function(el) {el.classList.add("d-none")});
    document.querySelectorAll(".showPremium").forEach(function(el) {el.classList.remove("d-none")});
    document.querySelectorAll(".hidePremium").forEach(function(el) {el.classList.add("d-none")});
  }

  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  });
}

async function checkAccountAndUpdateInfo(email,showToast) {
  if(accountsObject[email] == undefined)
  {
    return
  }

  if(accountsObject[email].id == undefined) {
    accountsObject[email].id = "website"
    //We need an accountId for the /accounts/accountId endpoint
    //When processing a login link, we don't have this ID yet, so we force it to "website"
  }

  var getAccountDetailsResult = await myFetch({
    url: "https://" + apiServer + ".gofile.io/accounts/" + accountsObject[email].id,
    headers: {
      "Authorization": "Bearer " + accountsObject[email].token
    }
  });
  if (getAccountDetailsResult.status != "ok") {
    delete accountsObject[email]
    if (!email.includes("guest")) {
      createToast({toastIcon:"bi-exclamation-circle",toastTitle:"Error",toastHeaderColor:"text-bg-danger",toastBody:JSON.stringify(getAccountDetailsResult)})
    }
    return
  }

  accountsObject[email] = getAccountDetailsResult.data

  //Icon
  accountsObject[email].icon = blockies.create({
    seed: accountsObject[email].email,
    size: 16,
  });

  //If email is a temp entry (because a login link is being processed), create the real entry
  if(email == "accountToCheck")
  {
    //If this is a guest account, remove the visually @gofile.io part that can be confusing
    if(accountsObject[email].email.includes("guest") && accountsObject[email].email.includes("@gofile.io"))
    {
      var emailGuest = accountsObject[email].email.replace("@gofile.io","")
      accountsObject[emailGuest] = accountsObject[email]
    }
    else{
      showToast = true
      accountsObject[accountsObject[email].email] = accountsObject[email]
      setAccountActive(accountsObject[email].email, showToast)
    }

    if(showToast) {
      createToast({toastIcon:"bi-exclamation-circle",toastTitle:"Account",toastHeaderColor:"text-bg-success",toastBody:"Account "+accountsObject[email].email+" has been connected"})
    }
    delete accountsObject[email]
  }
}

async function createGuestAccount(){
  var createAccountResult = await myFetch({
    url: "https://" + apiServer + ".gofile.io/accounts",
    method: "POST",
    data: {}
  })

  if (createAccountResult.status == "ok") {
    accountsObject.accountToCheck = {}
    accountsObject.accountToCheck.id = createAccountResult.data.id
    accountsObject.accountToCheck.token = createAccountResult.data.token
  }
  else {
    createToast({toastIcon:"bi-exclamation-circle",toastTitle:"Error",toastHeaderColor:"text-bg-danger",toastBody:JSON.stringify(createAccountResult)})
  }
}

// Builds the sidebar account list with the account information and actions
async function buildSidebarAccountList() {
  var listElem = document.querySelector("#sidebarAccountList");
  listElem.innerHTML = "";
  for (var account in accountsObject) {
    var activeClass = accountActive === account ? 'active' : '';
    var setActiveLink = accountActive === account ? '' : `<li><a class="dropdown-item setActive" href="#" data-account="${account}"><i class="bi bi-check2 me-1"></i>Set as Active Account</a></li>`;
    var setActiveDivider = accountActive === account ? '' : `<li><hr class="dropdown-divider"></li>`;
    var accountData = accountsObject[account];
    var accountIcon = accountData.icon.toDataURL();
    var premiumType = accountData.premiumType;

    listElem.innerHTML += `
      <div id="sidebarAccountList_${account}" class="mt-1 mb-1">
        <div class="row justify-content-center rounded-pill sidebarItem ${activeClass}" data-bs-toggle="dropdown">
          <div class="col-auto">
            <span><img width="32" height="32" class="rounded-5" src="${accountIcon}"></img></span>
          </div>
          <div class="col sidebarMobile text-truncate">
            <span>${account}</span>
          </div>
          <div class="col-auto">
            <span><i class="bi bi-arrow-down-short"></i></span>
          </div>
        </div>
        <ul class="dropdown-menu">
          <li><a class="dropdown-item ajaxLink" href="/myProfile"><i class="bi bi-person me-1"></i>My Profile</a></li>
          <li><a class="dropdown-item ajaxLink" href="/myFiles"><i class="bi bi-folder2-open me-1"></i>My Files</a></li>
          <!--<li><a class="dropdown-item ajaxLink" href="/trash"><i class="bi bi-trash me-1"></i>Trash</a></li>-->
          <li><hr class="dropdown-divider"></li>
          ${setActiveLink}
          ${setActiveDivider}
          <li><a class="dropdown-item ajaxLink" href="/logout"><i class="bi bi-box-arrow-left me-1"></i>Logout</a></li>
        </ul>
      </div>
    `;
  }
  sidebarCollapse(sidebarCollapseLevel);
}

async function logout(account){
  delete accountsObject[account]
  localStorage["accountsObject"] = JSON.stringify(accountsObject)//Update localStorage
  document.getElementById("sidebarAccountList_" + account).remove();
  if(Object.keys(accountsObject).length == 0)
  {
    createToast({toastIcon:"bi-exclamation-circle",toastTitle:"Account",toastHeaderColor:"text-bg-warning",toastBody:"Account "+account+" has been logged out of this session."})
    return await startup()
  }
  else
  {
    createToast({toastIcon:"bi-exclamation-circle",toastTitle:"Account",toastHeaderColor:"text-bg-warning",toastBody:"Account "+account+" has been logged out of this session."})
  }
  if(account == accountActive)
  {
    selectAccountActive();
    history.pushState(null, '', 'https://'+window.location.hostname+"/welcome");
    processURL();
  }
}

async function startup() {
  if (document.body.offsetWidth < 992)
  {
    sidebarCollapse(0)
  } else {
    sidebarCollapse(2)
  }

  //CMP
  // if(localStorage['cmpAccepted'] == undefined)
  // {
  //   var toastBody = `
  //   <div class="text-center">
  //     <div>
  //       Our services rely on cookies to operate properly. By using our services, you agree to the use of cookies. For more information on cookies and how your data is managed on our site, please refer to our <a class="ajaxLink" href='/privacy'>Privacy Policy</a> and <a class="ajaxLink" href='/terms'>Terms Of Service</a>.
  //     </div>
  //     <div>
  //       <button id="cmpAccept" class="btn btn-outline-secondary btn-sm mt-1 py-0 text-white" data-bs-dismiss="toast">I Accept</button>
  //     </div>
  //   </div>
  //   `
  //   createToast({toastIcon:"bi-exclamation-circle",toastTitle:"Cookies",toastHeaderColor:"text-bg-warning",toastBody:toastBody,toastAutohide:"false"})
  // }

  //Fill accountsObject from localStorage
  if (localStorage["accountsObject"] != undefined) {
    try {
      accountsObject = JSON.parse(localStorage["accountsObject"])
    }
    catch (error) {
      localStorage.removeItem("accountsObject")
      localStorage.removeItem("accountActive")
      return await startup()
    }
  }

  //This is a login link, we create a temp entry in the accountsObject because it will be checked and updated later by checkAccountAndUpdateInfo
  if (urlSplit[1] == "login" && urlSplit[2]) {
    accountsObject.accountToCheck = {}
    accountsObject.accountToCheck.token = urlSplit[2]
    history.replaceState(null, '', 'https://'+window.location.hostname+'/myProfile')
  }

  //Loop over all accounts in accountsObject and check validity / update info
  for (const account in accountsObject) {
    await checkAccountAndUpdateInfo(account)
  }

  //If no account in accountsObject at this step, create a guest one and checkAccountAndUpdateInfo again
  if (Object.keys(accountsObject).length == 0) {
    await createGuestAccount()
    for (const account in accountsObject) {
      await checkAccountAndUpdateInfo(account)
    }
  }

  //At this stage, an account must exist in localStorage, if not, stop with error
  if (Object.keys(accountsObject).length == 0) {
    return createModal({
      modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-danger"></i>Fatal error. Account system not available. Please try again later.</p></div>',
    })
  }

  //Update localStorage
  localStorage["accountsObject"] = JSON.stringify(accountsObject)

  //Get accountActive from localStorage
  accountActive = localStorage["accountActive"]

  //Check if accountActive is valid
  if (accountActive != undefined) {
    var accountActiveValid = false
    for (const account in accountsObject) {
      if (account == accountActive) {
        accountActiveValid = true
      }
    }
    if(accountActiveValid == false)
    {
      accountActive = undefined
      localStorage.removeItem('accountActive');
    }
  }

  //If there is no accountActive, choose one (the highest tier)
  if (accountActive == undefined) {
    selectAccountActive()
  }
  else
  {
    setAccountActive(accountActive)
  }

  buildSidebarAccountList()
}

//New files functions
async function addFilesToUploadQueue(files) {
  //If we are at uploadFiles pages, hides mainContent
  if(urlSplit[1] == "uploadFiles") {
    document.querySelector("#mainContent").classList.add("d-none")
  }

  var uuid = uuidv4()
  uploadQueue[uuid] = {}
  uploadQueue[uuid].state = "pending"
  createUploadDiv(uuid)
  
  document.querySelector("#mainUpload-"+uuid+" .mainUploadInitInfo").classList.remove("d-none")
  //Get the best server
  document.querySelector("#mainUpload-"+uuid+" .mainUploadInitInfoText").textContent = "Get destination server ..."
  var serversResult = await myFetch({url:"https://"+apiServer+".gofile.io/servers"})
	if(serversResult.status != "ok")
	{
	  if(document.querySelector("#mainUpload-"+uuid+" .mainUploadError").classList.contains("d-none"))
    {
      var divs = document.querySelectorAll("#mainUpload-" + uuid + " .contentCard > div");
      for (var i = 0; i < divs.length; i++) {
        divs[i].classList.add("d-none");
      }
      document.querySelector("#mainUpload-"+uuid+" .mainUploadError .mainUploadErrorTitle").innerHTML = '<i class="bi bi-exclamation-circle me-2 text-danger"></i>'+serversResult.status
      document.querySelector("#mainUpload-"+uuid+" .mainUploadError .mainUploadErrorText").innerHTML = 'Error getting server'
      document.querySelector("#mainUpload-"+uuid+" .mainUploadError").classList.remove("d-none");
      document.querySelector("#mainUpload-"+uuid+" .mainUploadClose").classList.remove("d-none");
    }
    uploadQueue[uuid].state = "canceled"
    return
	}
  var results = await Promise.all(serversResult.data.servers.map(server =>
    ping("https://" + server.name + ".gofile.io").then(time => ({ server: server.name, time }))
  ));
  var fastestServerTime = Math.min(...results.map(r => r.time));
  var filteredResults = results.filter(r => r.time <= fastestServerTime + 20);
  if (filteredResults.length === 0) {
      return alert("error");
  }
  console.log(filteredResults)
  uploadQueue[uuid].destServer = filteredResults[Math.floor(Math.random() * filteredResults.length)].server;
  console.log(uploadQueue[uuid].destServer)
  if (window.location.host.startsWith("dev-eu")) {
    uploadQueue[uuid].destServer = "store-eu-gra-dev-1"
    // uploadQueue[uuid].destServer = "store11"
  }
  else if (window.location.host.startsWith("dev-na")) {
    uploadQueue[uuid].destServer = "store-na-phx-dev-1"
  }

  document.querySelector("#mainUpload-"+uuid+" .mainUploadInitInfoText").textContent = "Get destination folder ..."
  //Get the destination folder
  if(urlSplit[1] == "d" && urlSplit[2] != undefined)
  {
    uploadQueue[uuid].destFolder = mainFolderObject.id
  }
  else
  {
    //This is a quickUpload, we must create a folder first before uploading
    var createFolderResult = await myFetch({
      url: "https://" + apiServer + ".gofile.io/contents/createfolder",
      method: "POST",
      data: {
        parentFolderId: accountsObject[accountActive].rootFolder,
      },
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accountsObject[accountActive].token
      }
    })
	  if(createFolderResult.status != "ok")
		{
		  if(document.querySelector("#mainUpload-"+uuid+" .mainUploadError").classList.contains("d-none"))
      {
        var divs = document.querySelectorAll("#mainUpload-" + uuid + " .contentCard > div");
        for (var i = 0; i < divs.length; i++) {
          divs[i].classList.add("d-none");
        }
        document.querySelector("#mainUpload-"+uuid+" .mainUploadError .mainUploadErrorTitle").innerHTML = '<i class="bi bi-exclamation-circle me-2 text-danger"></i>'+createFolderResult.status
        document.querySelector("#mainUpload-"+uuid+" .mainUploadError .mainUploadErrorText").innerHTML = 'Error creating folder'
        document.querySelector("#mainUpload-"+uuid+" .mainUploadError").classList.remove("d-none");
        document.querySelector("#mainUpload-"+uuid+" .mainUploadClose").classList.remove("d-none");
      }
      uploadQueue[uuid].state = "canceled"
      return
		}
    uploadQueue[uuid].destFolder = createFolderResult.data.id
    //We must set this folder public
		var setOptionResult = await myFetch({
      url: "https://" + apiServer + ".gofile.io/contents/" + uploadQueue[uuid].destFolder + "/update",
      method: "PUT",
      data: {
        attribute: "public",
        attributeValue: "true"
      },
      headers: {
        Authorization: `Bearer ${accountsObject[accountActive].token}`,
        "Content-Type": "application/json"
      }
    });
    if(setOptionResult.status != "ok")
		{
		  if(document.querySelector("#mainUpload-"+uuid+" .mainUploadError").classList.contains("d-none"))
      {
        var divs = document.querySelectorAll("#mainUpload-" + uuid + " .contentCard > div");
        for (var i = 0; i < divs.length; i++) {
          divs[i].classList.add("d-none");
        }
        document.querySelector("#mainUpload-"+uuid+" .mainUploadError .mainUploadErrorTitle").innerHTML = '<i class="bi bi-exclamation-circle me-2 text-danger"></i>'+setOptionResult.status
        document.querySelector("#mainUpload-"+uuid+" .mainUploadError .mainUploadErrorText").innerHTML = 'Error setting folder public'
        document.querySelector("#mainUpload-"+uuid+" .mainUploadError").classList.remove("d-none");
        document.querySelector("#mainUpload-"+uuid+" .mainUploadClose").classList.remove("d-none");
      }
      uploadQueue[uuid].state = "canceled"
      return
		}
  }

  document.querySelector("#mainUpload-"+uuid+" .mainUploadInitInfoText").textContent = "Preparing upload ..."
  uploadQueue[uuid].totalBytes = 0
  uploadQueue[uuid].totalBytesSent = 0
  uploadQueue[uuid].files = []
  for (let i = 0; i < files.length; i++) {
    uploadQueue[uuid].totalBytes += files[i].size
    var fileObject = {}
    fileObject.uuid = uuidv4()
    fileObject.state = "pending"
    fileObject.file = files[i]

    uploadQueue[uuid].files.push(fileObject)
    uploadQueue[uuid].timestamp = new Date().getTime()

    document.querySelector("#mainUpload-"+uuid+" .mainUploadInitInfo").classList.add("d-none");
    document.querySelector("#mainUpload-"+uuid+" .mainUploadGlobalInfo").classList.remove("d-none");
    document.querySelector("#mainUpload-"+uuid+" .mainUploadFilesList").classList.remove("d-none");
  }
  document.querySelector("#mainUpload-"+uuid+" .mainUploadGlobalInfoQueue").innerHTML = parseInt(files.length);
  processUploadQueue()
}
async function processUploadQueue() {
  for (const uuid in uploadQueue) {
    if(uploadQueue[uuid].state != "pending")
    {
      continue
    }
    for (let j = 0; j < uploadQueue[uuid].files.length; j++) {
      if(uploadQueue[uuid].files[j].state == "pending")
      {
        uploadQueue[uuid].files[j].timestamp = new Date().getTime()
        document.querySelector("#mainUpload-"+uuid+" .mainUploadCancel").classList.remove("d-none");
        uploadQueue[uuid].files[j].state = "uploading"
        uploadFile(uuid, j).then((uploadFileResult) => {
          uploadQueue[uuid].files[j].state = "done"

          document.querySelector("#mainUpload-"+uuid+" .mainUploadGlobalInfoQueue").innerHTML -= 1
          if(uploadFileResult.status != "ok") {
            if(document.querySelector("#mainUpload-"+uuid+" .mainUploadError").classList.contains("d-none"))
            {
              var divs = document.querySelectorAll("#mainUpload-" + uuid + " .contentCard > div");
              for (var i = 0; i < divs.length; i++) {
                divs[i].classList.add("d-none");
              }
              document.querySelector("#mainUpload-"+uuid+" .mainUploadError .mainUploadErrorTitle").innerHTML = '<i class="bi bi-exclamation-circle me-2 text-danger"></i>'+JSON.stringify(uploadFileResult)
              document.querySelector("#mainUpload-"+uuid+" .mainUploadError .mainUploadErrorText").innerHTML = 'Transfer of file '+uploadQueue[uuid].files[j].file.name+' failed'
              document.querySelector("#mainUpload-"+uuid+" .mainUploadError").classList.remove("d-none");
              document.querySelector("#mainUpload-"+uuid+" .mainUploadClose").classList.remove("d-none");
            }
            uploadQueue[uuid].state = "canceled"
          }
          else
          {
            //If all files are in "done" state, upload is finished
            var uploadFinished = true
            for (let k = 0; k < uploadQueue[uuid].files.length; k++) {
              if(uploadQueue[uuid].files[k].state != "done") {
                uploadFinished = false
              }
            }
            if(uploadFinished == true) {
              if(uploadFileResult.data.parentFolder == mainFolderObject.id)
              {
                //This is a file browser upload, do not display anything, just refresh
                createToast({toastIcon:"bi-exclamation-circle",toastTitle:"Success",toastHeaderColor:"text-bg-success",toastBody:"Your files have been successfully uploaded"})
                document.querySelector("#mainUpload-" + uuid).remove()
                sessionStorage['nextReqCache'] = false
                processURL()
              }
              else
              {
                //This is a new upload from quickUpload page
                var divs = document.querySelectorAll("#mainUpload-" + uuid + " .contentCard > div");
                for (var i = 0; i < divs.length; i++) {
                  divs[i].classList.add("d-none");
                }
                document.querySelector("#mainUpload-"+uuid+" .mainUploadSuccess").classList.remove("d-none");
                document.querySelector("#mainUpload-"+uuid+" .mainUploadSuccessLink a").setAttribute("href", "/d/"+uploadFileResult.data.parentFolderCode);
                document.querySelector("#mainUpload-"+uuid+" .mainUploadSuccessLink a").textContent = uploadFileResult.data.downloadPage
                document.querySelector("#mainUpload-"+uuid+" .mainUploadSuccessLink .copyText").setAttribute("data-copyText", uploadFileResult.data.downloadPage);
                document.querySelector("#mainUpload-"+uuid+" .mainUploadSuccessLink").classList.remove("d-none");
                new QRCode(document.querySelector("#mainUpload-"+uuid+" .mainUploadSuccessQR span"), {
                  text: uploadFileResult.data.downloadPage,
                  width: 128,
                  height: 128,
                });
                document.querySelector("#mainUpload-"+uuid+" .mainUploadSuccessQR").classList.remove("d-none");
                if(accountsObject[accountActive].tier != "premium")
                {
                  document.querySelector("#mainUpload-"+uuid+" .mainUploadSuccessNotPremWarn").classList.remove("d-none");
                }
                document.querySelector("#mainUpload-"+uuid+" .mainUploadClose").classList.remove("d-none");
              }
            }
          }
          processUploadQueue()
          var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
          var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
          });
        })
        break
      }
    }
  }
}
async function uploadFile(uploadQueueUuid, fileIndex) {
  return new Promise(async function(resolve) {
    //Add file line in upload div
    var toPrepend = `
		  <div id="${uploadQueue[uploadQueueUuid].files[fileIndex].uuid}" class="row justify-content-around">
		  	<div class="col-md-6 text-truncate"><span>${uploadQueue[uploadQueueUuid].files[fileIndex].file.name}</span></div>
	  		<div class="col-md-6">
	  			<div class="progress position-relative mt-1">
	  				<div class="progress-bar bg-primary" role="progressbar" style="width: 0%">
	  					<span class="justify-content-center d-flex position-absolute w-100 text-white">0% complete</span>
	  				</div>
	  			</div>
	  		</div>
		  </div>
		`
    //document.querySelector("#mainUpload-"+uploadQueueUuid+" .mainUploadFilesListDetails").innerHTML += toPrepend;
    document.querySelector("#mainUpload-"+uploadQueueUuid+" .mainUploadFilesListDetails").insertAdjacentHTML('afterbegin', toPrepend);

    var formData = new FormData();
    formData.append("folderId", uploadQueue[uploadQueueUuid].destFolder)
    formData.append("file", uploadQueue[uploadQueueUuid].files[fileIndex].file)

    var xhr = new XMLHttpRequest()
    xhr.responseType = "json"
    xhr.open("POST", "https://" + uploadQueue[uploadQueueUuid].destServer + ".gofile.io/contents/uploadFile", true)
    xhr.setRequestHeader("Authorization", "Bearer " + accountsObject[accountActive].token)
    xhr.addEventListener('error', function(e) {
      return resolve({status:"error-xhr",data:{}})
    });
    xhr.addEventListener("abort", function() {
      return resolve({status:"error-aborted",data:{}})
    });
    xhr.upload.addEventListener('progress', function(e) {
      if(uploadQueue[uploadQueueUuid].state == "canceled") {
        return xhr.abort(); // cancel the upload
      }

      uploadQueue[uploadQueueUuid].files[fileIndex].bytesSent = e.loaded
      uploadQueue[uploadQueueUuid].totalBytesSent = 0
      for (let i = 0; i < uploadQueue[uploadQueueUuid].files.length; i++) {
        if(uploadQueue[uploadQueueUuid].files[i].bytesSent) {
          uploadQueue[uploadQueueUuid].totalBytesSent += uploadQueue[uploadQueueUuid].files[i].bytesSent
        }
      }

      var totalPercent = uploadQueue[uploadQueueUuid].totalBytesSent / uploadQueue[uploadQueueUuid].totalBytes * 100
      var totalSecondsElapsed = (new Date().getTime() - uploadQueue[uploadQueueUuid].timestamp) / 1000
      var totalBytesPerSecond = uploadQueue[uploadQueueUuid].totalBytesSent / totalSecondsElapsed
      var totalKbytesPerSecond = totalBytesPerSecond / 1000
      var totalRemainingBytes = uploadQueue[uploadQueueUuid].totalBytes - uploadQueue[uploadQueueUuid].totalBytesSent
      var totalSecondsRemaining = totalRemainingBytes / totalBytesPerSecond

      document.querySelector("#mainUpload-"+uploadQueueUuid+" .mainUploadGlobalInfoRemainingTime").innerHTML = toHHMMSS(totalSecondsRemaining);
      document.querySelector("#mainUpload-"+uploadQueueUuid+" .mainUploadGlobalInfoPercent").innerHTML = Math.round(totalPercent);
      document.querySelector("#mainUpload-"+uploadQueueUuid+" .mainUploadGlobalInfoSpeed").innerHTML = Math.round(totalKbytesPerSecond);
      document.querySelector("#mainUpload-"+uploadQueueUuid+" .mainUploadGlobalInfoSentSize").innerHTML = humanFileSize(uploadQueue[uploadQueueUuid].totalBytesSent, true);
      document.querySelector("#mainUpload-"+uploadQueueUuid+" .mainUploadGlobalInfoTotalSize").innerHTML = humanFileSize(uploadQueue[uploadQueueUuid].totalBytes, true);

      //Calc speed for single file
      var secInterval = (new Date().getTime() - uploadQueue[uploadQueueUuid].files[fileIndex].timestamp) / 1000
      var bytesInterval = uploadQueue[uploadQueueUuid].files[fileIndex].bytesSent - uploadQueue[uploadQueueUuid].files[fileIndex].prevBytesSent
      var bytesPerSec = bytesInterval / secInterval

      //Calc progress for single file
      var progress = Math.round(uploadQueue[uploadQueueUuid].files[fileIndex].bytesSent / uploadQueue[uploadQueueUuid].files[fileIndex].file.size * 100)
      document.getElementById(uploadQueue[uploadQueueUuid].files[fileIndex].uuid).querySelector(".progress-bar").style.width = progress + '%';
      document.getElementById(uploadQueue[uploadQueueUuid].files[fileIndex].uuid).querySelector(".progress-bar span").innerHTML = "<span class=''>" + humanFileSize(uploadQueue[uploadQueueUuid].files[fileIndex].bytesSent, true) + "/" + humanFileSize(uploadQueue[uploadQueueUuid].files[fileIndex].file.size, true) + "</span><span class='text-success ms-1'>" + Math.round(progress) + "%" + "</span><span class='text-info ms-1'>" + Math.round(bytesPerSec/1000) + "kb/s" + "</span>";

      //Update fileProgressObject entry for the next calc
      uploadQueue[uploadQueueUuid].files[fileIndex].timestamp = new Date().getTime() //In millisecond
      uploadQueue[uploadQueueUuid].files[fileIndex].prevBytesSent = uploadQueue[uploadQueueUuid].files[fileIndex].bytesSent
    });
    xhr.addEventListener('load', function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        return resolve(xhr.response);
      } else {
        return resolve({status: "error-xhr", data: xhr.response});
      }
    });
    xhr.send(formData)
  })
}
async function createUploadDiv(uuid) {
  document.querySelector("#mainUpload").classList.remove("d-none");
  document.querySelector("#mainUpload").innerHTML +=
  `
  <div id="mainUpload-${uuid}" class="row justify-content-center mb-3 mainUploadUuid">
    <div class="col-lg-6">
      <div class="contentCard p-2">
        <div class="row mainUploadInitInfo d-none">
          <div class="col text-center">
            <div class="spinner-border" role="status"></div><br>
            <span class="mainUploadInitInfoText">Preparing upload ...</span>
          </div>
        </div>
        <div class="row mainUploadGlobalInfo d-none">
          <div class="col text-center">
            <div class="row">
              <div class="col">
                <i class="bi bi-clock me-1"></i><span class="d-none d-md-inline">Remaining time</span>
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="badge bg-secondary mainUploadGlobalInfoRemainingTime">00:00:00</span>
              </div>
            </div>
          </div>
          <div class="col text-center">
            <div class="col text-center">
              <div class="row">
                <div class="col">
                  <i class="bi bi-percent me-1"></i><span class="d-none d-md-inline">Progress</span>
                </div>
              </div>
              <div class="row">
                <div class="col">
                  <span class="badge bg-secondary"><span class="mainUploadGlobalInfoPercent">0</span> %</span><br>
                  <span class="badge bg-secondary"><span class="mainUploadGlobalInfoSentSize">0</span>/<span class="mainUploadGlobalInfoTotalSize">0</span></span><br>
                  <span class="badge bg-secondary"><span class="mainUploadGlobalInfoQueue">0</span> remaining files</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col text-center">
            <div class="col text-center">
              <div class="row">
                <div class="col">
                  <i class="bi bi-speedometer2 me-1"></i><span class="d-none d-md-inline">Average speed</span>
                </div>
              </div>
              <div class="row">
                <div class="col">
                  <span class="badge bg-secondary"><span class="mainUploadGlobalInfoSpeed">0</span> kb/s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row mt-3 mainUploadFilesList d-none">
          <div class="col text-center">
            <div class="row overflow-auto" style="max-height: 200px;">
              <div class="col mainUploadFilesListDetails">
              </div>
            </div>
          </div>
        </div>
        <div class="row mainUploadError d-none">
          <div class="col text-center">
            <div class="mainUploadErrorTitle"></div>
            <div class="mainUploadErrorText"></div>
          </div>
        </div>
        <div class="row justify-content-center mainUploadSuccess d-none">
          <div class="col-auto text-center">
            <div class="alert alert-secondary border border-success text-white"><i class="bi bi-exclamation-circle me-2 text-success"></i>Your files have been successfully uploaded</div>
          </div>
        </div>
        <div class="row mb-2 mainUploadSuccessLink d-none">
          <div class="col-6 text-center">
            <i class="bi bi-link me-1"></i>Download Link
          </div>
          <div class="col-6 text-center">
            <a href="https://dev.gofile.io/d/123abc" class="ajaxLink">https://dev.gofile.io/d/123abc</a><button class="btn btn-outline-secondary btn-sm ms-1 py-0 px-1 text-white copyText" data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="Copy download link" data-copyText=""><i class="bi bi-clipboard2"></i></button>
          </div>
        </div>
        <div class="row mainUploadSuccessQR d-none">
          <div class="col-6 text-center my-auto">
            <i class="bi bi-qr-code me-1"></i>QR code
          </div>
          <div class="col-6">
            <span></span>
          </div>
        </div>
        <div class="row justify-content-center mt-4 mainUploadSuccessNotPremWarn d-none">
          <div class="col-auto text-center">
            <div class="alert alert-secondary border border-warning text-white"><span><i class="bi bi-exclamation-circle me-2 text-warning"></i>Your account is not premium. Your files will expire after a while.<br>If you want to store your files indefinitely, <a class="ajaxLink" href="/premium">upgrade</a> your account to Premium.</span></div>
          </div>
        </div>
        <div class="row mt-2 mainUploadCancel d-none">
          <div class="col text-center">
            <button class="btn btn-outline-secondary btn-sm ms-1 py-0 text-white mainUploadCancelButton">Cancel</button>
          </div>
        </div>
        <div class="row mt-2 mainUploadClose d-none">
          <div class="col text-center">
            <button class="btn btn-outline-secondary btn-sm ms-1 py-0 text-white mainUploadCloseButton">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
}

//Files functions
async function getContent(contentId) {
  var fetchData = { wt: "4fd6sg89d7s6" }; // Move wt to URL query
  if (sessionStorage['password|' + contentId]) { fetchData.password = sessionStorage['password|' + contentId]; }
  if (sessionStorage['nextReqCache']) { fetchData.cache = sessionStorage['nextReqCache']; }
  sessionStorage.removeItem('nextReqCache');

  var getContentResult = await myFetch({
    url: "https://" + apiServer + ".gofile.io/contents/" + contentId + "?" + new URLSearchParams(fetchData).toString(),
    headers: { 'Authorization': 'Bearer ' + accountsObject[accountActive].token }
  });
  
  return getContentResult;
}

async function deleteContent(contentsId, proof){
  var modalCallback = async function() {
    createModal({
      showCloseBtn: false,
      isStatic: true,
      modalTitle: 'Loading ...',
      modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
    })

    var deleteContentResult = await myFetch({
      url: "https://" + apiServer + ".gofile.io/contents",
      method: "DELETE",
      data: {
        contentsId: contentsId,
        proof: proof
      },
      headers: {
        "Authorization": `Bearer ${accountsObject[accountActive].token}`,
        "Content-Type": "application/json"
      }
    })
    if(deleteContentResult.status == "error-proofNeeded")
  	{
  	  var modalCallback = async function() {
  	    var deleteContentResult = await myFetch({
          url: `https://${apiServer}.gofile.io/contents`,
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${accountsObject[accountActive].token}`,
            "Content-Type": "application/json"
          },
          data: {
            contentsId: contentsId,
            proof: document.querySelector("#modalJustificationInput").value
          }
        });
        if(deleteContentResult.status != "ok")
      	{
      	  createModal({
            modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
            modalBody: JSON.stringify(deleteContentResult)
          })
          sessionStorage['nextReqCache'] = false
      		return processURL()
      	}
      	createModal({
          modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>'+contentsId.split(",").length+' contents have been deleted</p></div>',
        })
        sessionStorage['nextReqCache'] = false
        return processURL()
      }
      var contentTemplate = `
        <div class="row">
    			<div class="col-auto">
    			  <span><i class="bi bi-exclamation-circle me-1 text-info"></i>State the justification for deleting this</span>
    		  </div>
    		</div>
    		<div id="modalLoading" class="row d-none justify-content-center">
    		  <div class="col-auto"><div class="spinner-border" role="status"></div></div>
    		</div>
    		<div id="ModalMain" class="row">
    			<div class="col">
    			  <div class="input-group text-center my-2">
    			    <textarea id="modalJustificationInput" class="form-control" rows="5" placeholder="Enter justification"></textarea>
            </div>
    		  </div>
    		</div>
    	`

    	return createModal({
        modalBody: contentTemplate,
        modalYesLabel: "Send",
        modalNoLabel: "Cancel",
        modalCallback: modalCallback
      })
  	}
    else if(deleteContentResult.status != "ok")
  	{
  	  createModal({
        modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
        modalBody: JSON.stringify(deleteContentResult)
      })
      sessionStorage['nextReqCache'] = false
  		return processURL()
  	}

    createModal({
      modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>The '+contentsId.split(",").length+' selected items have been successfully deleted</p></div>',
    })
    if(contentsId.split(",").length == 1 && mainFolderObject.id == contentsId.split(",")[0] && mainFolderObject.isOwner == true && mainFolderObject.parentFolder != undefined) {
      //Redirect to parent folder
      history.pushState(null, '', 'https://' + window.location.hostname + '/d/'+mainFolderObject.parentFolder)
    }
    sessionStorage['nextReqCache'] = false
    return processURL()
  }
  createModal({
    modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-info"></i>Please confirm the deletion of '+contentsId.split(",").length+' contents ?</p></div>',
    modalYesLabel: "Yes",
    modalNoLabel: "Cancel",
    modalCallback: modalCallback
  })
}

async function popupBeforeCopyContent(contentsId){
  if (accountsObject[accountActive].tier != "donor" && accountsObject[accountActive].tier != "premium") {
    return createModal({
      modalTitle: 'Upgrade Account',
      modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-warning"></i>Advanced features are only available with a premium account. Upgrade your account to access these features.</p></div>',
      modalYesLabel: "Upgrade",
      modalNoLabel: "Cancel",
      modalCallback: function() {
        history.pushState(null, '', 'https://' + window.location.hostname + '/premium')
				processURL()
      }
    })
  }

  sessionStorage['toCopy'] = contentsId
  document.querySelector("#filesContentToolbarCopyHere").classList.remove("d-none");
  document.querySelector("#filesContentToolbarCopyHereCount").innerHTML = sessionStorage['toCopy'].split(",").length;
  document.querySelectorAll(".filesContentOptionCopy").forEach(el => el.classList.remove("d-none"));
  document.querySelector("#filesContentToolbarCancelCopyHere").classList.remove("d-none");

  createModal({
    modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-info"></i>' + sessionStorage['toCopy'].split(",").length + ' element(s) have been copied. Go to the destination folder and click on the "copy here" button.</p></div>',
  });

  document.querySelectorAll('.filesContentCheckbox').forEach(function(element) {
    element.checked = false;
    element.dispatchEvent(new Event('change', {bubbles: true}));
  });
}

async function copyContent(contentsId, folderDestInfo){
  var modalCallback = async function() {
    createModal({
      showCloseBtn: false,
      isStatic: true,
      modalTitle: 'Loading ...',
      modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
    })

    var copyContentResult = await myFetch({
      url: `https://${apiServer}.gofile.io/contents/copy`,
      method: "POST",
      data: {
        contentsId: contentsId,
        folderId: folderDestInfo.id
      },
      headers: {
        'Authorization': `Bearer ${accountsObject[accountActive].token}`,
        'Content-Type': 'application/json'
      }
    });
    if(copyContentResult.status != "ok")
  	{
  	  createModal({
        modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
        modalBody: JSON.stringify(copyContentResult)
      })
  		return processURL()
  	}

  	createModal({
      modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>The '+contentsId.split(",").length+' selected items have been successfully copied to the destination location.</p></div>',
    })

    sessionStorage.removeItem('toCopy')
    sessionStorage['nextReqCache'] = false
    return processURL()
	}

	createModal({
    modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-info"></i>Are you sure you want to copy the '+contentsId.split(",").length+' selected items in the folder '+folderDestInfo.name+' ?</p></div>',
    modalYesLabel: "Yes",
    modalNoLabel: "Cancel",
    modalCallback: modalCallback
  })
}

async function importContent(contentsId){
  if (accountsObject[accountActive].tier != "donor" && accountsObject[accountActive].tier != "premium") {
    return createModal({
      modalTitle: 'Upgrade Account',
      modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-warning"></i>Advanced features are only available with a premium account. Upgrade your account to access these features.</p></div>',
      modalYesLabel: "Upgrade",
      modalNoLabel: "Cancel",
      modalCallback: function() {
        history.pushState(null, '', 'https://' + window.location.hostname + '/premium')
				processURL()
      }
    })
  }

  var modalCallback = async function() {
    createModal({
      showCloseBtn: false,
      isStatic: true,
      modalTitle: 'Loading ...',
      modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
    })

    var importContentResult = await myFetch({
      url: `https://${apiServer}.gofile.io/contents/import`,
      method: "POST",
      data: {
        contentsId: contentsId,
      },
      headers: {
        'Authorization': `Bearer ${accountsObject[accountActive].token}`,
        'Content-Type': 'application/json'
      }
    });
    if(importContentResult.status != "ok")
  	{
  	  return createModal({
        modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
        modalBody: JSON.stringify(importContentResult)
      })
  	}

  	createModal({
      modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>The content has been imported into your root folder.</p><a class="ajaxLink" href="/myFiles"><button class="btn btn-outline-secondary btn-sm p-1 text-white"><i class="bi bi-folder2-open me-1"></i>access your root folder</button></a></div>',
    })    

    sessionStorage['nextReqCache'] = false
	}

	createModal({
    modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-info"></i>Import this content into your account ?</p></div>',
    modalYesLabel: "Yes",
    modalNoLabel: "Cancel",
    modalCallback: modalCallback
  })
}

async function popupBeforeMoveContent(contentsId){
  if (accountsObject[accountActive].tier != "donor" && accountsObject[accountActive].tier != "premium") {
    return createModal({
      modalTitle: 'Upgrade Account',
      modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-warning"></i>Advanced features are only available with a premium account. Upgrade your account to access these features.</p></div>',
      modalYesLabel: "Upgrade",
      modalNoLabel: "Cancel",
      modalCallback: function() {
        history.pushState(null, '', 'https://' + window.location.hostname + '/premium')
				processURL()
      }
    })
  }

  sessionStorage['toMove'] = contentsId
  document.querySelector("#filesContentToolbarMoveHere").classList.remove("d-none");
  document.querySelector("#filesContentToolbarMoveHereCount").innerHTML = sessionStorage['toMove'].split(",").length;
  document.querySelectorAll(".filesContentOptionMove").forEach(el => el.classList.remove("d-none"));
  document.querySelector("#filesContentToolbarCancelMoveHere").classList.remove("d-none");

  createModal({
    modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-info"></i>' + sessionStorage['toMove'].split(",").length + ' element(s) are ready to be moved. Go to the destination folder and click on the "move here" button.</p></div>',
  });

  document.querySelectorAll('.filesContentCheckbox').forEach(function(element) {
    element.checked = false;
    element.dispatchEvent(new Event('change', {bubbles: true}));
  });
}

async function moveContent(contentsId, folderDestInfo){
  var modalCallback = async function() {
    createModal({
      showCloseBtn: false,
      isStatic: true,
      modalTitle: 'Loading ...',
      modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
    })

    var moveContentResult = await myFetch({
      url: "https://" + apiServer + ".gofile.io/contents/move",
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accountsObject[accountActive].token}`,
        'Content-Type': 'application/json',
      },
      data: {
        contentsId: contentsId,
        folderId: folderDestInfo.id,
      }
    });
    if(moveContentResult.status != "ok")
  	{
  	  createModal({
        modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
        modalBody: JSON.stringify(moveContentResult)
      })
  		return processURL()
  	}

  	createModal({
      modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>The '+contentsId.split(",").length+' selected items have been successfully moved to the destination location.</p></div>',
    })

    sessionStorage.removeItem('toMove')
    sessionStorage['nextReqCache'] = false
    return processURL()
	}

	createModal({
    modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-info"></i>Are you sure you want to move the '+contentsId.split(",").length+' selected items in the folder '+folderDestInfo.name+' ?</p></div>',
    modalYesLabel: "Yes",
    modalNoLabel: "Cancel",
    modalCallback: modalCallback
  })
}

async function downloadBulkContents(contentsId, contentInfo) {
  if (accountsObject[accountActive].tier != "donor" && accountsObject[accountActive].tier != "premium") {
    return createModal({
      modalTitle: 'Upgrade Account',
      modalBody: '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-warning"></i>Advanced features are only available with a premium account. Upgrade your account to access these features.</p></div>',
      modalYesLabel: "Upgrade",
      modalNoLabel: "Cancel",
      modalCallback: function() {
        history.pushState(null, '', 'https://' + window.location.hostname + '/premium')
				processURL()
      }
    })
  }

  //New implem with new direct link feature
  createModal({
    showCloseBtn: false,
    isStatic: true,
    modalTitle: 'Loading ...',
    modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
  });
  let data = {
    contentIdsToZip: contentsId,
    expireTime: Math.floor(Date.now() / 1000) + (5 * 60),
    isReqLink: true
  };
  
  if (sessionStorage['password|' + mainFolderObject.id]) {
    data.password = sessionStorage['password|' + mainFolderObject.id];
  }
  
  let createDirectLinkResult = await myFetch({
    url: `https://${apiServer}.gofile.io/contents/${contentInfo.id}/directlinks`,
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accountsObject[accountActive].token}`,
      "Content-Type": "application/json"
    },
    data: data
  });

  if (createDirectLinkResult.status === "ok") {
      var tempLink = document.createElement("a");
      tempLink.setAttribute("href", createDirectLinkResult.data.directLink);
      tempLink.click();
      modal.hide()
  } else {
      createModal({
          modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
          modalBody: JSON.stringify(createDirectLinkResult)
      });
  }

  return
}

async function loadTableFromFolderResult(sort, filter){
	// Clear all table lines
  document.querySelector("#filesContentTableContent").innerHTML = "";

  // Clean contentsSelected
  contentsSelected = {};

  // Update common folder info
  if(mainFolderObject.parentFolder) {
    document.querySelector("#filesContentParentLink").href = "/d/" + mainFolderObject.parentFolder;
  } else if(sessionStorage.getItem(mainFolderObject.id+"_parentFolder")) {
    document.querySelector("#filesContentParentLink").href = "/d/" + sessionStorage.getItem(mainFolderObject.id+"_parentFolder");
  }
  document.querySelector("#filesContentFolderName").innerHTML = mainFolderObject.name;
  document.querySelector("#filesContentFolderName").title = mainFolderObject.name;
  document.querySelector('#filesContentParent').parentElement.setAttribute('data-contentId', mainFolderObject.id); //Set data-contentId so option are clickable for the root folder
  document.querySelector('#filesContentFooter').setAttribute('data-contentId', mainFolderObject.id);
  document.querySelector("#filesContentFooterCreateTime").innerHTML = dayjs.unix(mainFolderObject.createTime).format('YYYY-MM-DD HH:mm:ss');
  document.querySelector("#filesContentFooterContentsCount").innerHTML = Object.keys(mainFolderObject.children).length;
  document.querySelector("#filesContentFooterTotalSize").innerHTML = humanFileSize(mainFolderObject.totalSize, true);
  document.querySelector("#filesContentFooterTotalDownloadCount").innerHTML = mainFolderObject.totalDownloadCount;

	// Update options state and related stuff
  if (mainFolderObject.isOwner == true) {
    document.getElementById("filesContentInfoOwner").classList.remove("d-none");
  }
  if (mainFolderObject.public == true) {
    document.getElementById("filesContentInfoPublic").classList.remove("d-none");
  }
  if (mainFolderObject.password != undefined) {
    document.getElementById("filesContentInfoPassword").classList.remove("d-none");
  }
  if (mainFolderObject.description != undefined) {
    document.querySelector("#filesDescription > div").innerHTML = marked(mainFolderObject.description);
    // Show the description row
    document.getElementById("filesDescription").classList.remove("d-none");
  }
  if (mainFolderObject.expire != undefined) {
    document.getElementById("filesContentInfoExpireContent").innerHTML = dayjs.unix(mainFolderObject.expire).format('YYYY-MM-DD HH:mm:ss');
    document.getElementById("filesContentInfoExpire").classList.remove("d-none");
  }

  if (mainFolderObject.tags != undefined) {
    document.getElementById("filesContentInfoTags").innerHTML = "";
    var tagsArray = mainFolderObject.tags.split(',');
    for (var i = 0; i < tagsArray.length; i++) {
      var tag = tagsArray[i];
      if (i > 0) {
        document.getElementById("filesContentInfoTags").innerHTML += '<span class="badge bg-secondary ms-1"><i class="bi bi-tag me-1"></i>' + tag + '</span>';
      }
      else {
        document.getElementById("filesContentInfoTags").innerHTML += '<span class="badge bg-secondary"><i class="bi bi-tag me-1"></i>' + tag + '</span>';
      }
    }
    document.getElementById("filesContentInfoTags").classList.remove("d-none");
  }
  if (mainFolderObject.directLinks && Object.keys(mainFolderObject.directLinks).length > 0) {
    document.getElementById("filesContentInfoDirectLinks").classList.remove("d-none");
    document.getElementById("filesContentInfoDirectLinksCount").textContent = Object.keys(mainFolderObject.directLinks).length;
  }

	var contentsAfterFilter = {}
	//Apply filter if any
	if(filter != undefined)
	{
		for (var contentId in mainFolderObject.children) {
			if(mainFolderObject.children[contentId].name.toLowerCase().includes(filter.toLowerCase()) || (mainFolderObject.children[contentId].tags && mainFolderObject.children[contentId].tags.toLowerCase().includes(filter.toLowerCase())))
			{
				contentsAfterFilter[contentId] = mainFolderObject.children[contentId]
			}
		}
	}
	else
	{
		contentsAfterFilter = mainFolderObject.children
	}

	if(sort == undefined)
	{
		sort = "Name"
	}

	//Sort contents, Create an array with id and name. Sort that array by name. Loop over that array and add content by contentId
	document.querySelectorAll(".filesContentToolbarSortByState").forEach(function(elem) {elem.innerHTML = ""});
  document.querySelector(".filesContentSort" + sort + " .filesContentToolbarSortByState").innerHTML = '<i class="bi bi-check"></i>';

	var sortArray = []
	if(sort == "Name")
	{
		for (var contentId in contentsAfterFilter)
		{
			sortArray.push([contentId, contentsAfterFilter[contentId].name])
		}
	}
	else if(sort == "Size")
	{
		for (var contentId in contentsAfterFilter)
		{
			if(contentsAfterFilter[contentId].type == "file")
			{
				sortArray.push([contentId, contentsAfterFilter[contentId].size])
			}
			else
			{
				sortArray.push([contentId, -1])
			}
		}
	}
	else if(sort == "Date")
	{
		for (var contentId in contentsAfterFilter)
		{
			sortArray.push([contentId, contentsAfterFilter[contentId].createTime])
		}
	}
	else if(sort == "Downloads")
	{
		for (var contentId in contentsAfterFilter)
		{
			if(contentsAfterFilter[contentId].type == "file")
			{
				sortArray.push([contentId, contentsAfterFilter[contentId].downloadCount])
			}
			else
			{
				sortArray.push([contentId, -1])
			}
		}
	}
	else if(sort == "Type")
	{
		for (var contentId in contentsAfterFilter)
		{
			if(contentsAfterFilter[contentId].type == "file")
			{
				sortArray.push([contentId, contentsAfterFilter[contentId].mimetype])
			}
			else
			{
				sortArray.push([contentId, "0"])
			}
		}
	}

	if(sort == "Name")
	{
		sortArray.sort((a, b) => a[1].localeCompare(b[1], navigator.languages[0] || navigator.language, {numeric: true, ignorePunctuation: true}))
	}
	else
	{
		sortArray.sort(function(a, b) {
	    if (a[1] < b[1]) {
	        return 1;
	    }
	    if (b[1] < a[1]) {
	        return -1;
	    }
	    return 0;
		});
	}

	for (var i = 0; i < sortArray.length; i++) {
	  addContentIdToTable(sortArray[i][0])
	}

	if (Object.keys(mainFolderObject.children).length == 0) {
    document.querySelectorAll('.hideSingleFile').forEach(function(el) {
      el.classList.add('d-none');
    });
    document.querySelector('#filesContentTableContent').innerHTML = '<div class="alert alert-secondary border border-info text-white"><i class="bi bi-exclamation-circle me-2 text-info"></i>This folder is empty.</div>';
  } else if (Object.keys(mainFolderObject.children).length == 1) {
    document.querySelectorAll('.hideSingleFile').forEach(function(el) {
      el.classList.add('d-none');
    });
    if (mainFolderObject.children[Object.keys(mainFolderObject.children)[0]].mimetype && mainFolderObject.children[Object.keys(mainFolderObject.children)[0]].mimetype.match(/video\/|image\/|audio\/|text\/|\/pdf/) && mainFolderObject.children[Object.keys(mainFolderObject.children)[0]].overloaded != true) {
      playFile(Object.values(mainFolderObject.children)[0], false);
    }
  }

	if(mainFolderObject.isOwner == true)
	{
    if (accountActive !== 'contact@gofile.io') {
      document.querySelectorAll('.hideOwner').forEach(el => {el.classList.add('d-none')});
    }    
		sessionStorage['nextReqCache'] = false
	}
	else
	{
		//Not the owner, we hide some content
		document.querySelectorAll('.hideNotOwner').forEach(el => {el.classList.add('d-none')});
	}

	if(mainFolderObject.parentFolder == undefined)
	{
		document.querySelector("#filesContentParent").classList.add("d-none");
	}

	//If parentFolder exist, we can display the parentLink button
	if(mainFolderObject.parentFolder || sessionStorage.getItem(mainFolderObject.id+"_parentFolder"))
	{
		document.getElementById("filesContentParent").classList.remove("d-none");
	}

	//If cleaner, show delete button
	if(accountsObject[accountActive].isCleaner)
	{
		document.querySelectorAll('.filesContentOptionDelete').forEach(el => el.classList.remove('d-none'));
	}
}

async function addContentIdToTable(contentId){
	var contentInfo = mainFolderObject.children[contentId]
  if(contentInfo.canAccess == false) {
    if(contentInfo.type == "folder") {
      var contentTemplate = ""
      contentTemplate += '<hr class="mx-5 my-1">'
      contentTemplate += '<div id="'+contentInfo.id+'" class="row p-1 align-items-center contentId" data-contentId="'+contentInfo.id+'">'
      contentTemplate += '<div class="col-md-auto"><input type="checkbox" class="filesContentCheckbox" value=""></div>'
      contentTemplate += '<div class="col-md-4 col-lg-5 col-xl-6 col-xxl-7 text-center text-md-start text-truncate pt-2"><i class="bi bi-folder-fill text-warning position-relative me-2"><small><span class="badge position-absolute top-0 start-100 translate-middle rounded-pill bg-secondary"><i class="bi bi-x"></i></span></small></i><a class="ajaxLink keepParentHistory" href="/d/'+contentInfo.id+'"><span class="contentName">'+contentInfo.name+'</span></a></div>'
      var divOptionTemplate = ''
      if(contentInfo.public == false)
      {
        divOptionTemplate += "<div data-bs-toggle='tooltip' data-bs-html='true' data-bs-title='This folder is private'><i class='bi bi-eye-fill me-1'></i>Private</div>"
      }
      if(contentInfo.password)
      {
        divOptionTemplate += "<div data-bs-toggle='tooltip' data-bs-html='true' data-bs-title='This folder is password protected'><i class='bi bi-lock-fill me-1'></i>Protected</div>"
      }
      if(contentInfo.expire)
      {
        divOptionTemplate += "<div data-bs-toggle='tooltip' data-bs-html='true' data-bs-title='This folder has expired'><i class='bi bi-clock-fill me-1'></i>"+dayjs.unix(contentInfo.expire).format('YYYY-MM-DD')+"</div>"
      }
      contentTemplate += '<div class="col-md-auto text-center text-md-end" style="min-width:100px;"><small>'+divOptionTemplate+'</small></div>'
      contentTemplate += '<div class="col-md-auto text-center text-md-start">'+dayjs.unix(contentInfo.createTime).format('YYYY-MM-DD HH:mm:ss')+'</div>'
      contentTemplate += '<div class="col-md text-center text-md-end px-0"></div>'
      return document.querySelector("#filesContentTableContent").insertAdjacentHTML('beforeend', contentTemplate);
    }
    return
  }
	var contentTemplate = ""
	contentTemplate += '<hr class="mx-5 my-1">'
  contentTemplate += '<div id="'+contentInfo.id+'" class="row p-1 align-items-center contentId" data-contentId="'+contentInfo.id+'">'
  contentTemplate += '<div class="col-md-auto"><input type="checkbox" class="filesContentCheckbox" value=""></div>'
  //Name column
  if(contentInfo.type == "folder") {
    contentTemplate += '<div class="col-md-4 col-lg-5 col-xl-6 col-xxl-7 text-center text-md-start text-truncate pt-2"><i class="bi bi-folder-fill text-warning position-relative me-2"><small><span class="badge position-absolute top-0 start-100 translate-middle rounded-pill bg-secondary">'+contentInfo.childrenCount+'</span></small></i><a class="ajaxLink keepParentHistory" href="/d/'+contentInfo.id+'"><span class="contentName">'+contentInfo.name+'</span></a></div>'
  }
  else{
    var fileIcon = '<i class="bi bi-file-earmark-fill me-2"></i>'
		if(contentInfo.mimetype.includes("image/"))
		{
			fileIcon = '<i class="bi bi-file-earmark-image-fill me-2"></i>'
		}
		else if(contentInfo.mimetype.includes("video/"))
		{
			fileIcon = '<i class="bi bi-file-earmark-play-fill me-2"></i>'
		}
		else if (contentInfo.mimetype.includes("audio/")) {
			fileIcon = '<i class="bi bi-file-earmark-music-fill me-2"></i>'
		}
		else if (contentInfo.mimetype.includes("/pdf")) {
			fileIcon = '<i class="bi bi-file-earmark-pdf-fill me-2"></i>'
		}
		else if (contentInfo.mimetype.includes("zip") || contentInfo.mimetype.includes("rar") || contentInfo.mimetype.includes("7z")) {
			fileIcon = '<i class="bi bi-file-earmark-zip-fill me-2"></i>'
		}
		if(contentInfo.overloaded == true) {
      var fileIcon = '<i class="bi bi-clock-history me-2"></i>'
		}
    contentTemplate += '<div class="col-md-4 col-lg-5 col-xl-6 col-xxl-7 text-center text-md-start text-truncate">'+fileIcon+'<a class="contentLink" href="javascript:void(0)"><span class="contentName">'+contentInfo.name+'</span></a></div>'
    if(contentInfo.thumbnail) {
      contentTemplate += `<div class="col-md-auto text-center"><img src="${contentInfo.thumbnail}" alt="Thumbnail" width="150" height="150" loading="lazy" class="me-2 filesContentOptionPlay" /></div>`
    }
  }
  //Details/Options column
  if(contentInfo.type == "folder") {
    var divOptionTemplate = ''
		if(contentInfo.public)
		{
			divOptionTemplate += "<div data-bs-toggle='tooltip' data-bs-html='true' data-bs-title='This folder is public'><i class='bi bi-eye-fill me-1'></i>Public</div>"
		}
		if(contentInfo.password)
		{
			divOptionTemplate += "<div data-bs-toggle='tooltip' data-bs-html='true' data-bs-title='This folder is password protected'><i class='bi bi-lock-fill me-1'></i>Protected</div>"
		}
		if(contentInfo.description)
		{
			divOptionTemplate += "<div data-bs-toggle='tooltip' data-bs-html='true' data-bs-title='This folder has a description'><i class='bi bi-blockquote-left-fill me-1'></i>Description</div>"
		}
		if(contentInfo.expire)
		{
			divOptionTemplate += "<div data-bs-toggle='tooltip' data-bs-html='true' data-bs-title='This folder has an expiration date'><i class='bi bi-clock-fill me-1'></i>"+dayjs.unix(contentInfo.expire).format('YYYY-MM-DD')+"</div>"
		}
		if(contentInfo.tags)
		{
			var tagsArray = contentInfo.tags.split(',')
			for (var i = 0; i < tagsArray.length; i++) {
			  var tag = tagsArray[i]
			  divOptionTemplate += "<div data-bs-toggle='tooltip' data-bs-html='true' data-bs-title='This folder has tags'><i class='bi bi-tag'></i><span class='badge bg-secondary ms-1'>"+tag+"</span></div>"
			}
		}
    if(contentInfo.directLinks && Object.keys(contentInfo.directLinks).length > 0)
    {
      divOptionTemplate += `<div data-bs-toggle='tooltip' data-bs-html='true' data-bs-title='This folder has direct links configured'><i class='bi bi-link-45deg me-1'></i>${Object.keys(contentInfo.directLinks).length} Direct links</div>`
    }
		contentTemplate += '<div class="col-md-auto text-center text-md-end" style="min-width:100px;"><small><div>'+contentInfo.childrenCount+' files</div>'+divOptionTemplate+'</small></div>'
  }
  else{
    var divOptionTemplate = ''
    if(contentInfo.directLinks && Object.keys(contentInfo.directLinks).length > 0)
    {
      divOptionTemplate += `<div data-bs-toggle='tooltip' data-bs-html='true' data-bs-title='This file has direct links configured'><i class='bi bi-link-45deg me-1'></i>${Object.keys(contentInfo.directLinks).length} Direct links</div>`
    }
    contentTemplate += '<div class="col-md-auto text-center text-md-end" style="min-width:100px;"><small><div>'+contentInfo.downloadCount+' downloads</div><div>'+humanFileSize(contentInfo.size,true)+'</div>'+divOptionTemplate+'</small></div>'
  }
  //date column
  contentTemplate += '<div class="col-md-auto text-center text-md-start">'+dayjs.unix(contentInfo.createTime).format('YYYY-MM-DD HH:mm:ss')+'</div>'
  //All buttons
  if(contentInfo.type == "folder") {
    contentTemplate += '<div class="col-md text-center text-md-end">'
    contentTemplate += '<button class="btn btn-outline-secondary btn-sm p-1 me-1 filesContentOption filesContentOptionDownload text-white"><i class="bi bi-file-earmark-arrow-down me-1 me-md-0 me-xl-1"></i><span class="d-md-none d-xl-inline">Download</span></button>'
    contentTemplate += '<a class="ajaxLink keepParentHistory me-1" href="/d/'+contentInfo.id+'"><button class="btn btn-outline-secondary btn-sm p-1 text-white"><i class="bi bi-folder2-open me-1 me-md-0 me-xl-1"></i><span class="d-md-none d-xl-inline">Open</span></button></a>'
    contentTemplate += '<button class="btn btn-outline-secondary btn-sm py-0 px-1 text-white" data-bs-toggle="dropdown"><i class="bi bi-three-dots"></i><small><i class="bi bi-caret-down-fill"></i></small></button>'
    contentTemplate += '<ul class="dropdown-menu" style="">'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionDownload" href="javascript:void(0)"><i class="bi bi-file-earmark-arrow-down me-1"></i>Download</a></li>'
    contentTemplate += '<li><a class="ajaxLink dropdown-item" href="/d/'+contentInfo.id+'"><i class="bi bi-folder2-open me-1"></i>Open</a></li>'
    contentTemplate += '<li><hr class="dropdown-divider hideNotOwner"></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionRename hideNotOwner" href="javascript:void(0)"><i class="bi bi-pencil me-1"></i>Rename</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionCopy hideNotOwner" href="javascript:void(0)"><i class="bi bi-files me-1"></i>Copy</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionCopyHere hideNotOwner d-none" href="javascript:void(0)"><i class="text-warning bi bi-files-alt me-1"></i>Copy Here</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionMove hideNotOwner" href="javascript:void(0)"><i class="bi bi-files me-1"></i>Move</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionMoveHere hideNotOwner d-none" href="javascript:void(0)"><i class="text-warning bi bi-arrows-move me-1"></i>Move Here</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionSettings hideNotOwner" href="javascript:void(0)"><i class="bi bi-gear me-1"></i>Settings</a></li>'
    contentTemplate += '<li><hr class="dropdown-divider hideNotOwner"></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionInfos" href="javascript:void(0)"><i class="bi bi-info-circle me-1"></i>Infos</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionShare" href="javascript:void(0)"><i class="bi bi-share me-1"></i>Share</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionImport hideOwner" href="javascript:void(0)"><i class="bi bi-download me-1"></i>Import</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionDelete hideNotOwner" href="javascript:void(0)"><i class="bi bi-trash me-1"></i>Delete</a></li>'
    contentTemplate += '</ul>'
    contentTemplate += '</div>'
  }
  else {
    contentTemplate += '<div class="col-md text-center text-md-end px-0">'
    contentTemplate += '<a class="me-1 contentLink" target="_blank" href="javascript:void(0)"><button class="btn btn-outline-secondary btn-sm p-1 text-white"><i class="bi bi-file-earmark-arrow-down me-1 me-md-0 me-xl-1"></i><span class="d-md-none d-xl-inline">Download</span></button></a>'
    if(contentInfo.mimetype && (contentInfo.mimetype.includes("image/") || contentInfo.mimetype.includes("video/") || contentInfo.mimetype.includes("audio/") || contentInfo.mimetype.includes("/pdf") || contentInfo.mimetype.includes("text/") || contentInfo.mimetype.includes("/json")))
    {
      contentTemplate += '<button class="btn btn-outline-secondary btn-sm p-1 me-1 filesContentOption filesContentOptionPlay text-white"><i class="bi bi-play-btn me-1 me-md-0 me-xl-1"></i><span class="d-md-none d-xl-inline">Play</span></button>'
      contentTemplate += '<button class="btn btn-outline-secondary btn-sm p-1 me-1 filesContentOption filesContentOptionClose text-white d-none"><i class="bi bi-x-circle me-1 me-md-0 me-xl-1"></i><span class="d-md-none d-xl-inline">Close</span></button>'
    }
    contentTemplate += '<button class="btn btn-outline-secondary btn-sm py-0 px-1 text-white" data-bs-toggle="dropdown"><i class="bi bi-three-dots"></i><small><i class="bi bi-caret-down-fill"></i></small></button>'
    contentTemplate += '<ul class="dropdown-menu" style="">'
    contentTemplate += '<li><a class="contentLink dropdown-item target="_blank" href="javascript:void(0)"><i class="bi bi-file-earmark-arrow-down me-1"></i>Download</a></li>'
    if(contentInfo.mimetype && (contentInfo.mimetype.includes("image/") || contentInfo.mimetype.includes("video/") || contentInfo.mimetype.includes("audio/") || contentInfo.mimetype.includes("/pdf") || contentInfo.mimetype.includes("text/") || contentInfo.mimetype.includes("/json")))
    {
      contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionPlay" href="javascript:void(0)"><i class="bi bi-play-btn me-1"></i>Play</a></li>'
      contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionClose d-none" href="javascript:void(0)"><i class="bi bi-x-circle me-1"></i>Close</a></li>'
    }
    contentTemplate += '<li><hr class="dropdown-divider hideNotOwner"></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionRename hideNotOwner" href="javascript:void(0)"><i class="bi bi-pencil me-1"></i>Rename</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionCopy hideNotOwner" href="javascript:void(0)"><i class="bi bi-files me-1"></i>Copy</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionCopyHere hideNotOwner d-none" href="javascript:void(0)"><i class="text-warning bi bi-files-alt me-1"></i>Copy Here</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionMove hideNotOwner" href="javascript:void(0)"><i class="bi bi-files me-1"></i>Move</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionMoveHere hideNotOwner d-none" href="javascript:void(0)"><i class="text-warning bi bi-arrows-move me-1"></i>Move Here</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionSettings hideNotOwner" href="javascript:void(0)"><i class="bi bi-gear me-1"></i>Settings</a></li>'
    contentTemplate += '<li><hr class="dropdown-divider hideNotOwner"></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionInfos" href="javascript:void(0)"><i class="bi bi-info-circle me-1"></i>Infos</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionImport hideOwner" href="javascript:void(0)"><i class="bi bi-download me-1"></i>Import</a></li>'
    contentTemplate += '<li><a class="dropdown-item filesContentOption filesContentOptionDelete hideNotOwner" href="javascript:void(0)"><i class="bi bi-trash me-1"></i>Delete</a></li>'
    contentTemplate += '</ul>'
    contentTemplate += '</div>'
  }
  //Close div
  contentTemplate += '</div>'

  document.querySelector("#filesContentTableContent").insertAdjacentHTML('beforeend', contentTemplate);
}

async function playFile(contentInfo, scroll){
  if(contentInfo.type != "file") {
    return
  }
  var contentRow = document.querySelector('[data-contentid="'+contentInfo.id+'"]');
  if (contentInfo.overloaded == true) {
    createModal({
      modalTitle: `
        <i class="bi bi-file-earmark-fill me-1"></i>
        <span class="text">${contentInfo.name}</span>
      `,
      modalBody: `
          <div class="text-center">
            <i class="bi bi-clock-history text-warning mb-3" style="font-size: 2rem;"></i>
            <h5 class="text-warning mb-4">Download Access Temporary Limited</h5>
            <p class="">
              The server <strong>${contentInfo.serverSelected}</strong> is currently handling a high volume of traffic. To ensure service quality, access to <strong>${contentInfo.name}</strong> is temporary limited.
            </p>
            <hr>
            <p class="my-3">
              Become a Premium member for uninterrupted, high-speed downloads - plus, you help support our platform!
            </p>
            <a href="javascript:void(0)" onclick="modal.hide(); history.pushState(null, '', 'https://' + window.location.hostname + '/premium'); processURL();" class="btn btn-warning btn-lg px-4">
              <i class="bi bi-star me-2"></i>Upgrade to Premium
            </a>
            <p class="mt-4 text-muted small">
              You can also retry later if you're not ready to upgrade. We appreciate your patience.
            </p>
          </div>
      `,
    });
  } else {
    if (document.getElementById("play-" + contentInfo.id)) {
      document.getElementById("play-" + contentInfo.id).remove();
    }
    var elemToInsert = ""
    if (contentInfo.mimetype.includes("video/")) {
      //elemToInsert = "<div id='play-"+contentInfo.id+"' class='col-12 playDiv text-center'><video id='elem-" + contentInfo.id + "' class='img-fluid' controls preload='none' style='max-height:100vh'><source src='" + contentInfo.link + "'></video></div>"
      elemToInsert = `
        <div id='play-${contentInfo.id}' class='col-12 playDiv text-center'>
          <video id='elem-${contentInfo.id}' class='img-fluid' controls preload='none' style='max-height:100vh'
          ${contentInfo.thumbnail ? `poster="${contentInfo.thumbnail}"` : ''}>
            <source src='${contentInfo.link}'>
          </video>
        </div>
      `;
    }
    else if (contentInfo.mimetype.includes("image/")) {
      elemToInsert = "<div id='play-"+contentInfo.id+"' class='col-12 playDiv text-center'><img id='elem-" + contentInfo.id + "' class='img-fluid' src='" + contentInfo.link + "' loading='lazy' style='max-height:90vh'></img></div>"
    }
    else if (contentInfo.mimetype.includes("audio/")) {
      elemToInsert = "<div id='play-"+contentInfo.id+"' class='col-12 playDiv text-center'><audio id='elem-" + contentInfo.id + "' controls src='" + contentInfo.link + "'</audio></div>"
    }
    else if (contentInfo.mimetype.includes("/pdf")) {
      elemToInsert = "<div id='play-"+contentInfo.id+"' class='col-12 playDiv text-center'><iframe id='elem-" + contentInfo.id + "' src='/plugins/pdfjs/web/viewer.html?file="+contentInfo.link+"' style='width: 100%;height: 90vh;'></iframe></div>"
    }
    else if (contentInfo.mimetype.includes("text/") || contentInfo.mimetype.includes("/json"))
    {
      if (contentInfo.size <= 1048576) {
        await fetch(contentInfo.link, {
          credentials: 'include'
        })
          .then(response => response.text())
          .then(data => {
            const escapeHTML = (str) => {
              return str.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;');
            };
          
            const escapedData = escapeHTML(data);
          
            elemToInsert = "<div id='play-"+contentInfo.id+"' class='col-12 playDiv'><pre id='elem-" + contentInfo.id + "' class='language-text' style='max-height:90vh; overflow:auto;'>" + escapedData + "</pre></div>";
          })
          .catch(() => {
            createToast({toastIcon:"bi-exclamation-circle",toastTitle:"Text file error",toastHeaderColor:"text-bg-warning",toastBody:"This file cannot be displayed. You can download it and view it locally on your device."});
          });
      } else {
        createToast({toastIcon:"bi-exclamation-circle",toastTitle:"File too large",toastHeaderColor:"text-bg-warning",toastBody:"This text file is too large to display in your browser. You can download it and view it locally on your device."});
      }
    }
    else
    {
      return
    }
  
    contentRow.querySelectorAll(".filesContentOptionClose").forEach(element => element.classList.remove("d-none"));
    contentRow.querySelectorAll(".filesContentOptionPlay").forEach(element => element.classList.add("d-none"));
  
    contentRow.insertAdjacentHTML('beforeend', elemToInsert);
  
    if(contentInfo.mimetype.includes("video/"))
    {
      new Plyr('#elem-' + contentInfo.id);
      var sources = document.getElementById(`elem-${contentInfo.id}`).querySelectorAll("source")
      sources.forEach(function(source) {
        source.addEventListener("error", function() {
          createToast({toastIcon:"bi-exclamation-circle",toastTitle:"Video error",toastHeaderColor:"text-bg-warning",toastBody:"This video cannot be played because the format is not compatible with your browser. You can download it and play it locally on your device."})
          closeFile(contentInfo)
        });
      });
    }

    if(contentInfo.mimetype.includes("text/") || contentInfo.mimetype.includes("/json"))
    {
      if (prismLoaded == false) {
        var cssToAdd = document.createElement('link');
        cssToAdd.setAttribute('rel', 'stylesheet');
        cssToAdd.setAttribute('href', '/dist/css/prism.css');
        document.head.appendChild(cssToAdd);
    
        var jsToAdd = document.createElement('script');
        jsToAdd.setAttribute('src', '/dist/js/prism.js');
        jsToAdd.onload = function() {
          prismLoaded = true;
        };
        document.head.appendChild(jsToAdd);
        
      }
    }
  
    //Do not scroll if there is only one file. This to avoid to skip some part of the page .play is autoclicked at page open
    //if(Object.keys(folderResult.contents).length > 1)
    if(scroll == true)
    {
      document.body.scrollTop = document.documentElement.scrollTop = document.getElementById(contentInfo.id).offsetTop;
    }
  }
}

async function closeFile(contentInfo) {
	var contentRow = document.querySelector('[data-contentid="'+contentInfo.id+'"]');
  var element = document.getElementById("play-" + contentInfo.id);
  if (element) {
    element.remove();
  }
	contentRow.querySelectorAll(".filesContentOptionPlay").forEach(element => element.classList.remove("d-none"));
  contentRow.querySelectorAll(".filesContentOptionClose").forEach(element => element.classList.add("d-none"));
}

async function showInfos(contentInfo) {
  const iconClass = contentInfo.type === "file" ? "bi-file-earmark-fill" : "bi-folder-fill text-warning";

  const labelValuePair = (label, value = '', icon = '', isButton = false) => `
    <div class="d-block d-xl-flex justify-content-between align-items-center mb-2">
      <span class="fw-bold d-block d-xl-inline">${icon} ${label}</span>
      <span class="text-muted d-block d-xl-inline">${value} ${isButton ? `<button class="btn btn-outline-secondary btn-sm ms-2 py-0 px-1 text-white copyText" data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="Copy ${label}" data-copyText="${value}"><i class="bi bi-clipboard2"></i></button>` : ''}</span>
    </div>
  `;

  const infoSection = (title, content, extra = '') => `
    <div class="col-12 my-3">
      <h5 class="border-bottom pb-2 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">${title} ${extra}</div>
      </h5>
      ${content}
    </div>
  `;

  const generalInfo = `
    ${labelValuePair('Name', contentInfo.name, '<i class="bi bi-file-text me-2"></i>', true)}
    ${labelValuePair('Type', contentInfo.type, '<i class="bi bi-tags me-2"></i>')}
    ${labelValuePair('Create time', dayjs.unix(contentInfo.createTime).format('YYYY-MM-DD HH:mm:ss'), '<i class="bi bi-calendar me-2"></i>')}
    ${labelValuePair('Content ID', contentInfo.id, '<i class "bi bi-hash me-2"></i>', true)}
  `;

  const fileInfo = contentInfo.type === "file" ? `
    ${contentInfo.thumbnail ? `<div class="text-center mb-3"><img src="${contentInfo.thumbnail}" alt="${contentInfo.name}" class="img-thumbnail" style="max-width: 150px; max-height: 150px;"></div>` : ''}
    ${labelValuePair('Size', humanFileSize(contentInfo.size, true), '<i class="bi bi-hdd-fill me-2"></i>')}
    ${labelValuePair('Download Count', contentInfo.downloadCount, '<i class="bi bi-cloud-arrow-down-fill me-2"></i>')}
    ${labelValuePair('Mimetype', contentInfo.mimetype, '<i class="bi bi-file-earmark-text-fill me-2"></i>')}
    ${labelValuePair('MD5', contentInfo.md5, '<i class="bi bi-check2-square me-2"></i>', true)}
    ${labelValuePair('Server', contentInfo.servers.join(', '), '<i class="bi bi-server me-2"></i>')}
  ` : '';

  const folderInfo = contentInfo.type === "folder" ? `
    ${labelValuePair('Contents', contentInfo.childrenCount, '<i class="bi bi-folder me-2"></i>')}
    ${labelValuePair('Download page', `https://${window.location.hostname}/d/${contentInfo.code}`, '<i class="bi bi-link-45deg me-2"></i>', true)}
  ` : '';

  const settingsInfo = mainFolderObject.isOwner ? `
    ${contentInfo.type === "folder" ? `
      ${labelValuePair('Visibility', contentInfo.public ? 'Public' : 'Private', '<i class="bi bi-eye-fill me-2"></i>')}
      ${labelValuePair('Password', contentInfo.password ? '****' : 'None', '<i class="bi bi-lock-fill me-2"></i>')}
      ${labelValuePair('Description', contentInfo.description ? `${contentInfo.description.substring(0, 30)}...` : 'None', '<i class="bi bi-card-text me-2"></i>')}
      ${labelValuePair('Expiration Date', contentInfo.expire ? dayjs.unix(contentInfo.expire).format('YYYY-MM-DD HH:mm:ss') : 'None', '<i class="bi bi-calendar-date-fill me-2"></i>')}
      ${labelValuePair('Tags', contentInfo.tags || 'None', '<i class="bi bi-tag-fill me-2"></i>')}
    ` : ''}
    ${labelValuePair('Direct Links', Object.values(contentInfo.directLinks || {}).length, '<i class="bi bi-link-45deg me-2"></i>')}
  ` : '';

  const settingsButton = mainFolderObject.isOwner ? 
    `<button class="btn btn-outline-secondary btn-sm ms-2 py-0 px-1 text-white filesContentOption filesContentOptionSettings"><i class="bi bi-gear"></i></button>`
    : '';

  const modalContent = `
    <div class="container">
      <div class="row" data-contentId='${contentInfo.id}'>
        <div class="col-12 text-center my-3">
          <h3 class="text-truncate"><i class="bi ${iconClass} me-2"></i><strong><span>${contentInfo.name}</span></strong></h3>
        </div>
        <div class="col-12 col-xl-6">
          ${infoSection('General Information', generalInfo)}
        </div>
        <div class="col-12 col-xl-6">
          ${contentInfo.type === 'file' ? infoSection('File Information', fileInfo) : infoSection('Folder Information', folderInfo)}
          ${settingsInfo ? infoSection('Settings', settingsInfo, settingsButton) : ''}
        </div>
      </div>
    </div>
  `;

  createModal({
    modalTitle: '<i class="bi bi-info-circle me-2"></i>Info',
    modalBody: modalContent
  });

  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}

async function showSettings(contentInfo, option) {
  if(option == undefined)
  {
    createModal({
      modalTitle:
        '<i class="bi bi-gear me-1"></i>Settings<br>'+
        (contentInfo.type == "folder"
          ? '<i class="bi bi-folder-fill me-1 text-warning"></i>'
          : '<i class="bi bi-file-earmark-fill me-1"></i>') +
        '<span class="text-warning">' +
        contentInfo.name +
        '</span>',
      modalBody: `
        <p class="mb-2">Click on the option you want to modify:</p>
        <div class="d-flex flex-column align-items-center p-4 rounded">
          ${
            contentInfo.type == "folder"
              ? `
              <button class="btn btn-warning modalBtn mb-3 w-100" id="publicOptionBtn">
                <i class="bi bi-eye-fill me-2"></i>Public / Private
              </button>
              <button class="btn btn-warning modalBtn mb-3 w-100" id="passwordOptionBtn">
                <i class="bi bi-lock-fill me-2"></i>Password
              </button>
              <button class="btn btn-warning modalBtn mb-3 w-100" id="descriptionOptionBtn">
                <i class="bi bi-file-text-fill me-2"></i>Description
              </button>
              <button class="btn btn-warning modalBtn mb-3 w-100" id="expireOptionBtn">
                <i class="bi bi-clock-fill me-2"></i>Expiration date
              </button>
              <button class="btn btn-warning modalBtn mb-3 w-100" id="tagsOptionBtn">
                <i class="bi bi-tag-fill me-2"></i>Tags
              </button>`
              : ""
          }
          ${
            accountsObject[accountActive].tier != "premium"
                ? '<p class="text-warning mt-2 mb-1">You must be a premium user to create direct links to your contents.</p>'
                : ""
          }
          <button class="btn btn-warning modalBtn mb-3 w-100" id="directLinksOptionBtn" ${
            accountsObject[accountActive].tier != "premium" ? "disabled" : ""
          }>
            <i class="bi bi-link-45deg me-2"></i>Direct links
          </button>
        </div>
      `,
      modalNoLabel: '<i class="bi bi-x-circle-fill me-2"></i>Cancel',
      modalCallback: async function () {},
    });
    
    document.querySelectorAll('.modalBtn').forEach(modalBtn => {
      modalBtn.addEventListener('click', function(event) {
        if (event.target.matches('#publicOptionBtn')) {
          showSettings(contentInfo, "public")
        }
        else if (event.target.matches('#passwordOptionBtn')) {
          showSettings(contentInfo, "password")
        }
        else if (event.target.matches('#descriptionOptionBtn')) {
          showSettings(contentInfo, "description")
        }
        else if (event.target.matches('#expireOptionBtn')) {
          showSettings(contentInfo, "expire")
        }
        else if (event.target.matches('#tagsOptionBtn')) {
          showSettings(contentInfo, "tags")
        }
        else if (event.target.matches('#directLinkOptionBtn')) {
          showSettings(contentInfo, "directLink")
        }
        else if (event.target.matches('#directLinksOptionBtn')) {
          showSettings(contentInfo, "directLinks")
        }
      }, {once: true});
    });
  }
  else
  {
    if(option == "public")
    {
      var modalTitle = '<i class="bi bi-eye-fill me-1"></i>Public / Private<br><i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span>'
      var modalBody = `
        <div class="row">
          <div class="col">
            <p class="text-muted mb-1"><i class="bi bi-exclamation-circle me-1 text-info"></i>A public folder is accessible to those you share the download link with. If the folder is not public, only the owner can access it.</p>
          </div>
        </div>
        <hr>
        <div class="row">
          <div class="col">
            <div class="d-flex align-items-center">
              <i class="bi ${contentInfo.public ? 'bi-eye' : 'bi-eye-slash'} me-2"></i>
              <div>The folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">${contentInfo.name}</span> is currently ${contentInfo.public ? 'public' : 'private'}.</div>
            </div>
          </div>
        </div>
        <div class="row mt-3">
          <div class="col text-center">
            ${contentInfo.public ? '<button class="btn btn-primary btn-sm showSettingsPublicChange"><i class="bi bi-eye-slash me-2"></i>Make Private</button>' : '<button class="btn btn-primary btn-sm showSettingsPublicChange"><i class="bi bi-eye me-2"></i>Make Public</button>'}
          </div>
        </div>
      `
      createModal({
        modalTitle: modalTitle,
        modalBody: modalBody,
      })

      document.querySelector('.showSettingsPublicChange').addEventListener('click', async function(event) {
        createModal({
          showCloseBtn: false,
          isStatic: true,
          modalTitle: 'Loading ...',
          modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
        });
        var value = contentInfo.public ? "false" : "true";
        let setOptionResult = await myFetch({
          url: "https://" + apiServer + ".gofile.io/contents/" + contentInfo.id + "/update",
          method: "PUT",
          data: {
            attribute: "public",
            attributeValue: value,
          },
          headers: {
            'Authorization': `Bearer ${accountsObject[accountActive].token}`,
            'Content-Type': 'application/json'
          }
        });

        if (setOptionResult.status !== "ok") {
          createModal({
            modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
            modalBody: JSON.stringify(setOptionResult)
          });
        } else {
          var modalBody = '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>The folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> has been set to ' + (value == "true" ? "Public" : "Private") + '</p></div>';
          createModal({
            modalBody: modalBody,
          });
          sessionStorage['nextReqCache'] = false
          processURL()
        }
      }, {once: true});
      return
    }
    else if (option == "password")
    {
      var modalTitle = '<i class="bi bi-lock-fill me-1"></i>Password<br><i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span>'
      var modalBody = `
        <div class="row">
          <div class="col">
            <p class="text-muted mb-1"><i class="bi bi-exclamation-circle me-1 text-info"></i>A password-protected folder requires a password to be entered in order to access it. Set an empty password to disable.</p>
          </div>
        </div>
        <hr>
        <div class="row">
          <div class="col">
            ${contentInfo.password ?
              '<div>The folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> is currently password-protected.</div>' :
              '<div>The folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> is not currently password-protected.</div>'}
          </div>
        </div>
        <div class="form-group"><label for="modalInput">Enter a password:</label><input type="password" class="form-control" id="modalInput" placeholder="Enter password"></div>
        <div class="row mt-3">
          <div class="col text-center">
            <button class="btn btn-primary btn-sm showSettingsPasswordChange"><i class="bi bi-lock me-2"></i>Set password</button>
          </div>
        </div>
      `
      createModal({
        modalTitle: modalTitle,
        modalBody: modalBody,
      })
      document.querySelector('.showSettingsPasswordChange').addEventListener('click', async function(event) {
        var value = document.getElementById('modalInput').value
        createModal({
          showCloseBtn: false,
          isStatic: true,
          modalTitle: 'Loading ...',
          modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
        });
        let setOptionResult = await myFetch({
          url: "https://" + apiServer + ".gofile.io/contents/" + contentInfo.id + "/update",
          method: "PUT",
          data: {
            attribute: "password",
            attributeValue: value,
          },
          headers: {
            'Authorization': `Bearer ${accountsObject[accountActive].token}`,
            'Content-Type': 'application/json'
          }
        });

        if (setOptionResult.status !== "ok") {
          createModal({
            modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
            modalBody: JSON.stringify(setOptionResult)
          });
        } else {
          var modalBody = '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>The password of folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> has been ' + (value == "" ? "disabled" : "set") + '</p></div>';
          createModal({
            modalBody: modalBody,
          });
          sessionStorage['nextReqCache'] = false
          processURL()
        }
      }, {once: true});
      return
    }
    else if (option == "description")
    {
      var modalTitle = '<i class="bi bi-file-text-fill me-1"></i>Description<br><i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span>'
      var modalBody = `
        <div class="row">
          <div class="col">
            <p class="text-muted mb-1"><i class="bi bi-exclamation-circle me-1 text-info"></i>A description, located just above the folder's contents, can be added to provide context or additional information to viewers. The text can be styled using markdown syntax. It can be disabled by setting it to an empty string.</p>
          </div>
        </div>
        <hr>
        <div class="row">
          <div class="col">
            ${contentInfo.description ?
              '<div>The folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> has a description.</div>' :
              '<div>The folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> does not have a description.</div>'}
          </div>
        </div>
        <div class="form-group"><label for="modalInput">Enter a description:</label><textarea class="form-control" id="modalInput" rows="3" placeholder="Enter a description for the folder">${contentInfo.description != undefined ? contentInfo.description:''}</textarea></div>
        <div class="row mt-3">
          <div class="col text-center">
            <button class="btn btn-primary btn-sm showSettingsDescriptionChange"><i class="bi bi-file-text me-2"></i>Set description</button>
          </div>
        </div>
      `
      createModal({
        modalTitle: modalTitle,
        modalBody: modalBody,
      })
      document.querySelector('.showSettingsDescriptionChange').addEventListener('click', async function(event) {
        var value = document.getElementById('modalInput').value
        createModal({
          showCloseBtn: false,
          isStatic: true,
          modalTitle: 'Loading ...',
          modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
        });
        let setOptionResult = await myFetch({
          url: "https://" + apiServer + ".gofile.io/contents/" + contentInfo.id + "/update",
          method: "PUT",
          data: {
            attribute: "description",
            attributeValue: value,
          },
          headers: {
            'Authorization': `Bearer ${accountsObject[accountActive].token}`,
            'Content-Type': 'application/json'
          }
        });

        if (setOptionResult.status !== "ok") {
          createModal({
            modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
            modalBody: JSON.stringify(setOptionResult)
          });
        } else {
          var modalBody = '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>The description of folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> has been ' + (value == "" ? "cleared" : "set") + '</p></div>';
          createModal({
            modalBody: modalBody,
          });
          sessionStorage['nextReqCache'] = false
          processURL()
        }
      }, {once: true});
      return
    }
    else if (option == "expire")
    {
      var modalTitle = '<i class="bi bi-clock-fill me-1"></i>Expiration<br><i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span>';
      var modalBody = `
        <div class="row">
          <div class="col">
            <p class="text-muted mb-1"><i class="bi bi-exclamation-circle me-1 text-info"></i>An expiration date allows you to set when the folder and its contents will no longer be accessible.</p>
          </div>
        </div>
        <hr>
        <div class="row">
          <div class="col">
            ${contentInfo.expire ?
              '<div>The folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> is currently set to expire on ' + dayjs.unix(contentInfo.expire).format('YYYY-MM-DD HH:mm:ss') + '.</div>' :
              '<div>The folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> is not currently set to expire.</div>'}
    		  </div>
        </div>
        ${contentInfo.expire ?
        '':
        '<div class="form-group"><label for="modalInput">Enter expiration date:</label><input type="datetime-local" class="form-control" id="modalInput" placeholder="Enter expiration date" value="' + dayjs().add(1, 'day').format("YYYY-MM-DDTHH:mm") + '"></div>'}
        <div class="row mt-3">
          <div class="col text-center">
            ${contentInfo.expire ? '<button class="btn btn-primary btn-sm showSettingsExpireChange"><i class="bi bi-clock-history me-2"></i>Disable expiration date</button>' : '<button class="btn btn-primary btn-sm showSettingsExpireChange"><i class="bi bi-clock-fill me-2"></i>Set expiration date</button>'}
          </div>
        </div>
      `
      createModal({
        modalTitle: modalTitle,
        modalBody: modalBody,
      })

      document.querySelector('.showSettingsExpireChange').addEventListener('click', async function(event) {
        if(contentInfo.expire == undefined && dayjs(document.getElementById('modalInput').value).isValid() == false) {
          createModal({
            modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
            modalBody: 'Invalid Value'
          });
          return
        }
        var value = contentInfo.expire ? "" : dayjs(document.getElementById('modalInput').value).unix();
        createModal({
          showCloseBtn: false,
          isStatic: true,
          modalTitle: 'Loading ...',
          modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
        });
        let setOptionResult = await myFetch({
          url: "https://" + apiServer + ".gofile.io/contents/" + contentInfo.id + "/update",
          method: "PUT",
          data: {
            attribute: "expiry",
            attributeValue: value,
          },
          headers: {
            'Authorization': `Bearer ${accountsObject[accountActive].token}`,
            'Content-Type': 'application/json'
          }
        });

        if (setOptionResult.status !== "ok") {
          createModal({
            modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
            modalBody: JSON.stringify(setOptionResult)
          });
        } else {
          var modalBody = '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>The expiration of folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> has been ' + (value == "" ? "disabled" : "set to " + dayjs.unix(value).format('YYYY-MM-DD HH:mm:ss')) + '</p></div>';
          createModal({
            modalBody: modalBody,
          });
          sessionStorage['nextReqCache'] = false
          processURL()
        }
      }, {once: true});
      return
    }
    else if (option == "tags")
    {
      var modalTitle = '<i class="bi bi-tag-fill me-1"></i>Tags<br><i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span>'
      var modalBody = `
        <div class="row">
          <div class="col">
            <p class="text-muted mb-1"><i class="bi bi-exclamation-circle me-1 text-info"></i>Tags are labels that can be added to folders to help organize and classify them. You can add multiple tags by separating them with a comma.</p>
          </div>
        </div>
        <hr>
        <div class="row">
          <div class="col">
            ${contentInfo.tags != undefined && contentInfo.tags.length > 0 ?
              '<div>The folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> has the following tags: '+contentInfo.tags.split(",").map(tag => '<span class="badge bg-secondary">' + tag + '</span>').join(' ')+'</div>' :
              '<div>The folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> has no tags.</div>'}
          </div>
        </div>
        <div class="form-group"><label for="modalInput">Enter tags:</label><input type="text" class="form-control" id="modalInput" value="${contentInfo.tags != undefined && contentInfo.tags.length > 0 ? contentInfo.tags:''}" placeholder="Enter tags (separated by commas)"></div>
        <div class="row mt-3">
          <div class="col text-center">
            <button class="btn btn-primary btn-sm showSettingsTagsChange"><i class="bi bi-tag-fill me-2"></i>Set tags</button>
          </div>
        </div>
      `
      createModal({
        modalTitle: modalTitle,
        modalBody: modalBody,
      })
      document.querySelector('.showSettingsTagsChange').addEventListener('click', async function(event) {
        var value = document.getElementById('modalInput').value
        createModal({
          showCloseBtn: false,
          isStatic: true,
          modalTitle: 'Loading ...',
          modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
        });
        let setOptionResult = await myFetch({
          url: "https://" + apiServer + ".gofile.io/contents/" + contentInfo.id + "/update",
          method: "PUT",
          data: {
            attribute: "tags",
            attributeValue: value,
          },
          headers: {
            'Authorization': `Bearer ${accountsObject[accountActive].token}`,
            'Content-Type': 'application/json'
          }
        });

        if (setOptionResult.status !== "ok") {
          createModal({
            modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
            modalBody: JSON.stringify(setOptionResult)
          });
        } else {
          var modalBody = '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>The tags of folder <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">'+contentInfo.name+'</span> have been ' + (value == "" ? "cleared" : "set to " + value) + '</p></div>';
          createModal({
            modalBody: modalBody,
          });
          sessionStorage['nextReqCache'] = false
          processURL()
        }
      }, {once: true});
      return
    }
    else if (option == "directLink") 
    {
      var modalTitle = '<i class="bi bi-link-45deg me-1"></i>Direct Link<br><i class="bi bi-file-fill me-1"></i><span class="text-warning">' + contentInfo.name + '</span>'
      var modalBody = `
      <div class="row">
        <div class="col">
          <p class="text-muted mb-1"><i class="bi bi-exclamation-circle me-1 text-info"></i>A direct link provides a streamlined method for users to download a file without the need to access the website. By enabling or disabling this feature for a specific file, you can manage the accessibility of your content more efficiently.</p>
        </div>
      </div>
      <hr>
      <div class="row">
        <div class="col">
          <div class="d-flex align-items-center">
            <i class="bi ${contentInfo.directLink ? 'bi-link-45deg' : 'bi-link-broken'} me-2"></i>
            <div>The file <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">${contentInfo.name}</span> currently has direct link ${contentInfo.directLink ? 'enabled' : 'disabled'}.</div>
          </div>
          ${
            contentInfo.directLink
              ? `<div class="mt-3">
                  <div class="input-group">
                    <input type="text" class="form-control" value="${contentInfo.directLink}" readonly>
                    <span class="input-group-append">
                      <button class="btn btn-outline-secondary btn-sm ms-1 py-0 px-1 text-white copyText" data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="Copy direct link" data-copytext="${contentInfo.directLink}">
                        <i class="bi bi-clipboard2"></i>
                      </button>
                    </span>
                  </div>
                </div>`
              : ''
          }
        </div>
      </div>
      <div class="row mt-3">
        <div class="col text-center">
          ${contentInfo.directLink ? '<button class="btn btn-primary btn-sm showSettingsDirectlinkChange"><i class="bi bi-link-broken me-2"></i>Disable Direct Link</button>' : '<button class="btn btn-primary btn-sm showSettingsDirectlinkChange" disabled><i class="bi bi-link-45deg me-2"></i>Enable Direct Link</button>'}
        </div>
      </div>
    `
    createModal({
      modalTitle: modalTitle,
      modalBody: modalBody,
    })

    document.querySelector('.showSettingsDirectlinkChange').addEventListener('click', async function(event) {
      createModal({
        showCloseBtn: false,
        isStatic: true,
        modalTitle: 'Loading ...',
        modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
      });
      var value = contentInfo.directLink ? "false" : "true";
      let setOptionResult = await myFetch({
        url: "https://" + apiServer + ".gofile.io/setOption",
        method: "PUT",
        data: {
          contentId: contentInfo.id,
          option: "directLink",
          value: value
        },
        headers: {
          'Authorization': `Bearer ${accountsObject[accountActive].token}`,
          'Content-Type': 'application/json'
        }
      });

      if (setOptionResult.status !== "ok") {
        createModal({
          modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
          modalBody: JSON.stringify(setOptionResult)
        });
      } else {
        var modalBody = '<div class="text-center"><p><i class="bi bi-exclamation-circle me-2 text-success"></i>The direct link of file <i class="bi bi-file-fill me-1"></i><span class="text-warning">'+contentInfo.name+'</span> has been ' + (value == "true" ? "enabled" : "disabled") + '</p></div>';
        if (value == "true") {
          modalBody += '<div class="mt-3"><div class="input-group"><input type="text" class="form-control" value="' + setOptionResult.data + '" readonly><span class="input-group-append"><button class="btn btn-outline-secondary btn-sm ms-1 py-0 px-1 text-white copyText" data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="Copy direct link" data-copytext="' + setOptionResult.data + '"><i class="bi bi-clipboard2"></i></button></span></div></div>';
        }
        createModal({
          modalBody: modalBody,
        });
        sessionStorage['nextReqCache'] = false
        processURL()
      }
    }, {once: true});
    return
    }
    else if (option == "directLinks") {    
      var modalTitle = '<i class="bi bi-gear me-1"></i>Settings<br>'+(contentInfo.type == "folder" ? '<i class="bi bi-folder-fill me-1 text-warning"></i>' : '<i class="bi bi-file-earmark-fill me-1"></i>') + '<span class="text-warning">' + contentInfo.name + '</span>'
      var modalBody = `
      <div class="row">
        <div class="col">
          <p class="text-muted mb-2 fs-6"><i class="bi bi-exclamation-circle me-1 text-info"></i>A direct link (also called hotlink) provides a streamlined method for users to download a file without the need to access the website. Create multiple direct links for the same content to manage accessibility efficiently.</p>
        </div>
      </div>
      <hr>
      <div class="row">
        <div class="col">
          <div class="d-flex align-items-center mb-3">
          <span><i class="bi bi-link-45deg me-1"></i>The file <i class="bi bi-folder-fill me-1 text-warning"></i><span class="text-warning">${contentInfo.name}</span> currently has ${Object.values(contentInfo.directLinks || {}).length} active direct links.</span>
          </div>
        </div>
      </div>
      <div class="row">
          <div class="col directLinksContainer">
              <!-- Direct links will be appended here -->
          </div>
      </div>
      <div class="mt-4 text-center">
          <button class="btn btn-primary showSettingsDirectLinksCreateNew">
              <i class="bi bi-plus-circle"></i> Create New Link
          </button>
      </div>
      `;
      createModal({
          modalTitle: modalTitle,
          modalBody: modalBody,
      });
      
      let linksHtml = '';
      for (const [linkId, linkDetails] of Object.entries(contentInfo.directLinks || {})) {
        linksHtml += `
          <div class="row">
            <div class="col">
              <div class="p-3 mt-1 rounded border shadow-sm">
                  <div>
                      <div class="input-group mb-2">
                          <input type="text" class="form-control" value="${linkDetails.directLink}" readonly>
                          <span class="input-group-append">
                              <button class="btn btn-outline-secondary btn-sm ms-1 py-0 px-1 text-white copyText" data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="Copy direct link" data-copytext="${linkDetails.directLink}">
                                  <i class="bi bi-clipboard2"></i>
                              </button>
                          </span>
                      </div>
                      <p class="mb-2"><i class="bi bi-clock-history me-1 text-muted"></i>Expires: <span class="badge bg-secondary">${dayjs.unix(linkDetails.expireTime).format('YYYY-MM-DD HH:mm:ss')}</span>
                      <span><small><i class="bi bi-question-circle ms-1" data-bs-toggle="tooltip" data-bs-title="Setting an expiration date makes the link inactive after the specified time. An expiration date is required, but it can be set far in the future if desired."></i></small></span>
                      <input type="datetime-local" class="edit-input form-control d-none mt-1" data-type="expireTime" data-link-id="${linkId}" value="${dayjs.unix(linkDetails.expireTime).format('YYYY-MM-DDTHH:mm')}"></p>
                      <p class="mb-2"><i class="bi bi-globe me-1 text-muted"></i>Allowed Domains: ${linkDetails.domainsAllowed.length ? linkDetails.domainsAllowed.map(domain => `<span class="badge bg-secondary">${domain}</span>`).join(' ') : '<span class="badge bg-secondary">Any</span>'}
                      <small><i class="bi bi-question-circle ms-1" data-bs-toggle="tooltip" data-bs-title="If set, the link will work only from the specified domains. We use CORS and Referer checks. Note: This solution is not foolproof but greatly limits the potential for unauthorized use. Multiple domains can be set, separated by spaces."></i></small><input type="text" class="edit-input form-control d-none mt-1" data-type="domainsAllowed" data-link-id="${linkId}" value="${linkDetails.domainsAllowed.join(' ')}"></p>
                      <p class="mb-2"><i class="bi bi-shield-lock me-1 text-muted"></i>Source IPs Allowed: ${linkDetails.sourceIpsAllowed.length ? linkDetails.sourceIpsAllowed.map(ip => `<span class="badge bg-secondary">${ip}</span>`).join(' ') : '<span class="badge bg-secondary">Any</span>'}
                      <small><i class="bi bi-question-circle ms-1" data-bs-toggle="tooltip" data-bs-title="If set, the link will only work from the specified source IPs. Multiple IPs can be set, separated by spaces."></i></small><input type="text" class="edit-input form-control d-none mt-1" data-type="sourceIpsAllowed" data-link-id="${linkId}" value="${linkDetails.sourceIpsAllowed.join(' ')}"></p>
                      <p class="mb-2"><i class="bi bi-key me-1 text-muted"></i>Authentication: ${linkDetails.auth.length ? linkDetails.auth.map(auth => `<span class="badge bg-secondary">${auth}</span>`).join(' ') : '<span class="badge bg-secondary">None</span>'}
                      <small><i class="bi bi-question-circle ms-1" data-bs-toggle="tooltip" data-bs-title="If set, HTTP Basic authentication will be required to use the link. Format: login:password. Multiple credentials can be set, separated by spaces."></i></small><input type="text" class="edit-input form-control d-none mt-1" data-type="auth" data-link-id="${linkId}" value="${linkDetails.auth.join(' ')}"></p>
                      <p class="mb-2"><i class="bi bi-download me-1 text-muted"></i>Add <span class="text-info">?inline=true</span> at the end of the link to force Inline Content-Disposition
                      <small><i class="bi bi-question-circle ms-1" data-bs-toggle="tooltip" data-bs-title="Inline Content-Disposition force the browser to display the content instead of downloading it. Useful for files that browsers can render like PDFs or images."></i></small></p>
                      <button class="btn btn-warning btn-sm py-0 me-1 showSettingsDirectLinksEdit" data-link-id="${linkId}">Edit</button>
                      <button class="btn btn-info btn-sm py-0 showSettingsDirectLinksApply d-none" data-link-id="${linkId}">Apply</button>
                      <button class="btn btn-secondary btn-sm py-0 showSettingsDirectLinksCancel d-none" data-link-id="${linkId}">Cancel</button>
                      <button class="btn btn-danger btn-sm py-0 showSettingsDirectLinksRemove" data-link-id="${linkId}">Remove</button>
                  </div>
              </div>
            </div>
          </div>
        `;
      }
      document.querySelector('.directLinksContainer').innerHTML = linksHtml;
      
      document.querySelectorAll('.showSettingsDirectLinksRemove').forEach(element => {
          element.addEventListener('click', async function(event) {
              createModal({
                showCloseBtn: false,
                isStatic: true,
                modalTitle: 'Loading ...',
                modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
              });
              let deleteDirectLinkResult = await myFetch({
                url: "https://" + apiServer + ".gofile.io/contents/" + contentInfo.id + "/directlinks/" + event.target.getAttribute('data-link-id'),
                method: "DELETE",
                headers: {
                  'Authorization': `Bearer ${accountsObject[accountActive].token}`,
                  'Content-Type': 'application/json'
                },
                data: {}
              });
  
              sessionStorage['nextReqCache'] = false;
              var getContentResult = await getContent(mainFolderObject.id)
              if(getContentResult.status == "ok" && getContentResult.data.type == "folder") {
                mainFolderObject = getContentResult.data
              }
              
              if (deleteDirectLinkResult.status === "ok") {
                if(mainFolderObject.id == contentInfo.id) {
                  await showSettings(mainFolderObject, "directLinks")
                } else {
                  await showSettings(mainFolderObject.children[contentInfo.id], "directLinks")
                }
              } else {
                  createModal({
                      modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
                      modalBody: JSON.stringify(deleteDirectLinkResult)
                  });
              }
          });
      });
  
      document.querySelectorAll('.showSettingsDirectLinksEdit').forEach(element => {
        element.addEventListener('click', function(event) {
            let linkId = event.target.getAttribute('data-link-id');
            document.querySelector(`.showSettingsDirectLinksCreateNew`).classList.add('d-none'); // Hide new button 
            document.querySelector(`.showSettingsDirectLinksRemove[data-link-id="${linkId}"]`).classList.add('d-none'); // Hide remove button
            document.querySelector(`.showSettingsDirectLinksApply[data-link-id="${linkId}"]`).classList.remove('d-none'); // Show apply button
            document.querySelector(`.showSettingsDirectLinksCancel[data-link-id="${linkId}"]`).classList.remove('d-none'); // Show cancel button
            document.querySelectorAll(`.edit-input[data-link-id="${linkId}"]`).forEach(input => {
                input.classList.remove('d-none');
            });
            document.querySelectorAll(`[data-link-id="${linkId}"] span.badge`).forEach(span => {
                span.classList.add('d-none');
            });
            event.target.classList.add('d-none'); // Hide edit button using d-none
        });
      });

      document.querySelectorAll('.showSettingsDirectLinksCancel').forEach(button => {
        button.addEventListener('click', function(event) {
              let linkId = event.target.getAttribute('data-link-id');
              document.querySelector(`.showSettingsDirectLinksApply[data-link-id="${linkId}"]`).classList.add('d-none'); // Hide apply button
              document.querySelector(`.showSettingsDirectLinksCancel[data-link-id="${linkId}"]`).classList.add('d-none'); // Hide cancel button
              document.querySelector(`.showSettingsDirectLinksEdit[data-link-id="${linkId}"]`).classList.remove('d-none'); // Show edit button
              document.querySelector(`.showSettingsDirectLinksRemove[data-link-id="${linkId}"]`).classList.remove('d-none'); // Show remove button
              document.querySelector(`.showSettingsDirectLinksCreateNew`).classList.remove('d-none'); // Show new button 
              document.querySelectorAll(`.edit-input[data-link-id="${linkId}"]`).forEach(input => {
                  input.classList.add('d-none');
              });
              document.querySelectorAll(`[data-link-id="${linkId}"] span.badge`).forEach(span => {
                  span.classList.remove('d-none');
              });
          });
      });
  
      document.querySelectorAll('.showSettingsDirectLinksApply').forEach(button => {
        button.addEventListener('click', async function(event) {
            let linkId = event.target.getAttribute('data-link-id');
            let expireTimeInput = document.querySelector(`.edit-input[data-link-id="${linkId}"][data-type="expireTime"]`).value;
            
            let sourceIpsAllowedInput = document.querySelector(`.edit-input[data-link-id="${linkId}"][data-type="sourceIpsAllowed"]`).value;
            sourceIpsAllowedInput = sourceIpsAllowedInput ? sourceIpsAllowedInput.split(' ') : [];
            
            let domainsAllowedInput = document.querySelector(`.edit-input[data-link-id="${linkId}"][data-type="domainsAllowed"]`).value;
            domainsAllowedInput = domainsAllowedInput ? domainsAllowedInput.split(' ') : [];
            
            let authInput = document.querySelector(`.edit-input[data-link-id="${linkId}"][data-type="auth"]`).value;
            authInput = authInput ? authInput.split(' ') : [];
    
            // Calculation of expireTime in UNIX timestamp
            let expireTimeTimestamp = new Date(expireTimeInput).getTime() / 1000;
    
            createModal({
                showCloseBtn: false,
                isStatic: true,
                modalTitle: 'Loading ...',
                modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
            });
    
            // Using the same endpoint as create, just added more data
            let editDirectLinkResult = await myFetch({
              url: "https://" + apiServer + ".gofile.io/contents/" + contentInfo.id + "/directlinks/" + linkId,
              method: "PUT",
              data: {
                expireTime: expireTimeTimestamp,
                sourceIpsAllowed: sourceIpsAllowedInput,
                domainsAllowed: domainsAllowedInput,
                auth: authInput
              },
              headers: {
                'Authorization': `Bearer ${accountsObject[accountActive].token}`,
                'Content-Type': 'application/json'
              }
            });
    
            if (editDirectLinkResult.status === "ok") {
                sessionStorage['nextReqCache'] = false;
                var getContentResult = await getContent(mainFolderObject.id)
                if(getContentResult.status == "ok" && getContentResult.data.type == "folder") {
                  mainFolderObject = getContentResult.data
                }
                if(mainFolderObject.id == contentInfo.id) {
                  await showSettings(mainFolderObject, "directLinks")
                } else {
                  await showSettings(mainFolderObject.children[contentInfo.id], "directLinks")
                }
            } else {
                createModal({
                    modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
                    modalBody: JSON.stringify(editDirectLinkResult)
                });
            }
        });
      });
    
      document.querySelector('.showSettingsDirectLinksCreateNew').addEventListener('click', async function(event) {
          createModal({
            showCloseBtn: false,
            isStatic: true,
            modalTitle: 'Loading ...',
            modalBody: '<div class="text-center"><div class="spinner-border" role="status"></div></div>'
          });
          let createDirectLinkResult = await myFetch({
            url: "https://" + apiServer + ".gofile.io/contents/"+ contentInfo.id +"/directlinks",
            method: "POST",
            data: {
                contentIdsToZip: undefined
            },
            headers: {
              "Authorization": "Bearer " + accountsObject[accountActive].token,
              "Content-Type": "application/json"
            }
          });
    
          if (createDirectLinkResult.status === "ok") {
              sessionStorage['nextReqCache'] = false;
              var getContentResult = await getContent(mainFolderObject.id)
              if(getContentResult.status == "ok" && getContentResult.data.type == "folder") {
                mainFolderObject = getContentResult.data
              }
              if(mainFolderObject.id == contentInfo.id) {
                await showSettings(mainFolderObject, "directLinks")
              } else {
                await showSettings(mainFolderObject.children[contentInfo.id], "directLinks")
              }
              
          } else {
              createModal({
                  modalTitle: '<i class="bi bi-exclamation-circle me-2 text-danger"></i>Error',
                  modalBody: JSON.stringify(createDirectLinkResult)
              });
          }
      });
    }
  }

  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  });
}

async function showShare(contentInfo) {
  var contentTemplate = `
    <div class="row">
			<div class="col-auto">
			  <span><strong>Download page</strong><small><button id="showSharePageCopy" class="btn btn-outline-secondary btn-sm ms-1 py-0 px-1 text-white copyText" data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="Copy download page" data-copyText="https://`+window.location.hostname+`/d/`+contentInfo.code+`"><i class="bi bi-clipboard2"></i></button></small></span><br>
			  <span class="text-muted text-truncate"><a href="https://`+window.location.hostname+`/d/`+contentInfo.code+`" target="_blank">https://`+window.location.hostname+`/d/`+contentInfo.code+`</a></span>
		  </div>
		</div>
		<div class="mt-1 mb-1 border-top border-secondary"></div>
		<div class="row">
			<div class="col-auto">
			  <span><strong>Social networks</strong></span><br>
			  <span>
			    <a href="https://www.facebook.com/sharer/sharer.php?u=https://`+window.location.hostname+`/d/`+contentInfo.code+`" target="_blank"><i class="bi bi-facebook fs-2 me-1"></i></a>
    			<a href="https://twitter.com/intent/tweet?text=https://`+window.location.hostname+`/d/`+contentInfo.code+`" target="_blank"><i class="bi bi-twitter fs-2 me-1"></i></a>
    			<a href="https://www.reddit.com/submit?url=https://`+window.location.hostname+`/d/`+contentInfo.code+`" target="_blank"><i class="bi bi-reddit fs-2"></i></a>
			  </span>
		  </div>
		</div>
	`
	if (contentInfo.public != true)
	{
		contentTemplate += `
			<div class="mt-1 mb-1 border-top border-secondary"></div>
			<div class="row">
  			<div class="col-auto">
  			  <span class="font-italic"><small><i class="bi bi-exclamation-circle me-1 text-warning"></i>This folder is not public. Only the owner can access it. Make this folder public before sharing the download page.</small></span>
  			</div>
  		</div>
		`
	}
	if (contentInfo.password == true)
	{
		contentTemplate += `
		  <div class="mt-1 mb-1 border-top border-secondary"></div>
			<div class="row">
  			<div class="col-auto">
  			  <span class="font-italic"><small><i class="bi bi-exclamation-circle me-1 text-warning"></i>This folder is password protected.</small></span>
  			</div>
  		</div>
		`
	}

	createModal({
    modalTitle: '<i class="bi bi-share me-2"></i>Share',
    modalBody: contentTemplate
  })

  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  });
}

//Test function
function adStatusCallback(status) {
  if (status) {
    console.log('Applixir status: ' + status);
    if(status == "ad-started" || status == "ads-unavailable") {
      modal.hide()
    }
    else {
      modal.hide()
    }
  }
  localStorage.setItem('lastVideoAdTimestamp', Math.floor(new Date().getTime() / 1000));
}
async function launchAppLixirAd(){
  document.querySelector('#AppLixirAdBtn').classList.add("d-none");
  document.querySelector('#AppLixirAdBtnLoading').classList.remove("d-none");
  localStorage.setItem('lastVideoAdTimestamp', Math.floor(new Date().getTime() / 1000));

  var options = {
      zoneId: 5782,
      gameId: 7955,
      accountId: 7446,
      userId: accountsObject[accountActive].id,
      vSize: "1024x768",
      vSizeM: "max",
      rewarded: true,
      adStatusCb: adStatusCallback,
  };
  var counter = 0
  while(typeof invokeApplixirVideoUnit == "undefined") {
    await sleep(1000)
    counter++
    if(counter > 5)
    {
      localStorage.setItem('lastVideoAdTimestamp', Math.floor(new Date().getTime() / 1000));
      modal.hide()
      break
    }
  }
  invokeApplixirVideoUnit(options);
}

//Ads
async function launchAds() {
  //Wait for mainFolderObject to be populated
  while (Object.keys(mainFolderObject).length == 0){
    await sleep(200)
  }
  //Check if folder has media content
  let hasMedia = false;
  const mediaTypes = ['image', 'video'];
  if(mainFolderObject.children) {
    for (let child of Object.values(mainFolderObject.children)) {
      if (child.mimetype) {
        const mainType = child.mimetype.split('/')[0];
        if (mediaTypes.includes(mainType)) {
          hasMedia = true;
          break;
        }
      }
    }
  }

  if (entryPage.split('/')[1] == "d" && accountsObject[accountActive].tier != "premium" && (mainFolderObject.totalDownloadCount > 10 || mainFolderObject.error == "error-notFound") && entryPage.split('/')[2] != "synpar")
   {
      var currentTimestamp = Math.floor(new Date().getTime() / 1000)

      document.getElementById("adsATF").classList.remove("d-none");
      if ((random > 0) && (localStorage.getItem('clickaduTimestamp') == undefined || currentTimestamp - localStorage.getItem('clickaduTimestamp') > 43200) && referrer.match(/simpcity|socialmediagirls|phica|leakimedia/)) {
        //Clickadu ATF
        if(document.getElementById("adsATF").innerHTML == "") {
          document.getElementById("adsATF").innerHTML = '<small>To disable ads, <a href="/premium" class="ajaxLink">upgrade</a> your account to Premium</small><br>'
          mustLoadClickadu = true
        }
        //localStorage.setItem('clickaduTimestamp', currentTimestamp);
      }
      else if ((random > 1) && (localStorage.getItem('nordvpnTimestamp') == undefined || currentTimestamp - localStorage.getItem('nordvpnTimestamp') > 43200)) {
        //NordVPN ATF
        if(document.getElementById("adsATF").innerHTML == "")
        {
          document.getElementById("adsATF").innerHTML = '<small>To disable ads, <a href="/premium" class="ajaxLink">upgrade</a> your account to premium</small><br><a href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=28850&file_id=96" target="_blank"><img src="https://media.go2speed.org/brand/files/nordvpn/15/20160415072821-300x250v2.jpg" width="300" height="250" border="0" /></a><img src="https://go.nordvpn.net/aff_i?offer_id=15&file_id=96&aff_id=28850" width="0" height="0" style="position:absolute;visibility:hidden;" border="0" />';
          // document.getElementById("adsATF").innerHTML = '<small>To disable ads, <a href="/premium" class="ajaxLink">upgrade</a> your account to premium</small><br><a href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=28850&file_id=23" target="_blank"><img src="https://media.go2speed.org/brand/files/nordvpn/15/300x250v10.gif" width="300" height="250" border="0" /></a><img src="https://go.nordvpn.net/aff_i?offer_id=15&file_id=23&aff_id=28850" width="0" height="0" style="position:absolute;visibility:hidden;" border="0" />';
          localStorage.setItem('nordvpnTimestamp', currentTimestamp);
        }
      }
      else if ((random > 0.95) && (localStorage.getItem('linkvertiseTimestamp') == undefined || currentTimestamp - localStorage.getItem('linkvertiseTimestamp') > 43200)) {
        //linkvertise ATF
        if(document.getElementById("adsATF").innerHTML == "")
        {
          localStorage.setItem('linkvertiseTimestamp', currentTimestamp);
          mustLoadLinkvertise = true
        }
      }
      else if ((random > 0) && (localStorage.getItem('aadsTimestamp') == undefined || currentTimestamp - localStorage.getItem('aadsTimestamp') > 43200)) {
        //Aads ATF
        if(document.getElementById("adsATF").innerHTML == "")
        {
          document.getElementById("adsATF").innerHTML = '<small>To disable ads, <a href="/premium" class="ajaxLink">upgrade</a> your account to premium</small><br><iframe data-aa="2059298" src="//ad.a-ads.com/2059298?size=300x250" style="width:300px; height:250px; border:0px; padding:0; overflow:hidden; background-color: transparent;"></iframe>';
          localStorage.setItem('aadsTimestamp', currentTimestamp);
        }
      }
      else if(random > 0) {
        //Clickadu2 ATF
        if(document.getElementById("adsATF").innerHTML == "")
        {
          document.getElementById("adsATF").innerHTML = '<small>To disable ads, <a href="/premium" class="ajaxLink">upgrade</a> your account to Premium</small><br>'
          mustLoadClickadu2 = true
        }
      }
      else if(random > 0) {
        //Galaksion ATF
        if(document.getElementById("adsATF").innerHTML == "")
        {
          document.getElementById("adsATF").innerHTML = '<small>To disable ads, <a href="/premium" class="ajaxLink">upgrade</a> your account to Premium</small><br>'
          mustLoadGalaksion = true
        }
      }
      
      if(random > 1){
        //sticky
      }

      if(mustLoadGalaksion == true && galaksionScriptLoaded == false) {
        var adScriptTag = document.createElement('script');
        adScriptTag.src = '//streitmackled.com/tiqPgzYDdEcfP/68172';
        adScriptTag.async = true;
        document.getElementById('adsATF').appendChild(adScriptTag);
        galaksionScriptLoaded = true
      }
      if(mustLoadClickadu == true && clickaduScriptLoaded == false) {
        var adScript = document.createElement('script');
        adScript.setAttribute('data-cfasync','false');
        adScript.setAttribute('class','__clb-2023524'); 
        adScript.setAttribute('src','//qnp16tstw.com/lv/esnk/2023524/code.js');
        document.getElementById("adsATF").appendChild(adScript);
        clickaduScriptLoaded = true
      }
      if(mustLoadClickadu2 == true && clickadu2ScriptLoaded == false) {
        var adScript = document.createElement('script');
        adScript.setAttribute('data-cfasync','false');
        adScript.setAttribute('class','__clb-2035294'); 
        adScript.setAttribute('src','//brittlesturdyunlovable.com/lv/esnk/2035294/code.js');
        document.getElementById("adsATF").appendChild(adScript);
        clickadu2ScriptLoaded = true
      }
      if(mustLoadLinkvertise == true && linkvertiseScriptLoaded == false) {
        var keyword = "download"
        if(mainFolderObject.error == undefined && Object.values(mainFolderObject.children)[0] != undefined) {
          keyword = Object.values(mainFolderObject.children)[0].name
        }
        // console.log(keyword)
        var adScript = document.createElement('script');
        adScript.setAttribute('src','https://integrate.linkvertise.com/serp-script.js');
        adScript.setAttribute('id','lv-ads'); 
        adScript.setAttribute('data-integration-id','2999'); 
        adScript.setAttribute('data-ad-number',1); 
        adScript.setAttribute('data-keyword',keyword); 
        adScript.setAttribute('data-jsonp',"handleAds"); 
        document.head.appendChild(adScript);
        linkvertiseScriptLoaded = true
      }
      if(mustLoadMahimeta == true && mahiMetaScriptLoaded == false) {
        document.getElementById("adsATF").innerHTML += '<ins class="adsbymahimeta" id="mMTag_Responsive_15666494" data-size="Responsive" data-desktop="300x250" data-tablet="300x250" data-mobile="300x250" style="display:inline-block;"></ins>';
        var cachebuster = Math.round(new Date().getTime() / 1000); 
        var mMTagScript = document.createElement('script'); 
        mMTagScript.src = '//mahimeta.com/networks/tag.js?cache='+cachebuster;
        document.getElementsByTagName("head")[0].appendChild(mMTagScript);
        mahiMetaScriptLoaded = true
      }
   }
 };

//Specific page JS
async function afterPageWelcomeLoad() {

}
async function afterPageFilesLoad() {
  if (urlSplit[1] == "uploadFiles") {
	  document.getElementById("filesLoading").classList.add("d-none");
	  document.getElementById("filesHeader").classList.remove("d-none");
	  document.getElementById("filesUpload").classList.remove("d-none");
	  if(Object.keys(accountsObject).length > 1) {
	    var alertElement = document.querySelector("#filesHeader .alert");
	    alertElement.innerHTML += '<span class="text-info"><small><i>Multiple accounts connected.<br>Selected account is '+accountActive+'</i></small></span>';
	  }
	}
	if (urlSplit[1] == "d") {
    launchAds()
    var getContentResult = await getContent(urlSplit[2])
		document.querySelector("#filesLoading").classList.add("d-none");
    if(getContentResult.status == "error-notFound"){
      mainFolderObject.error = "error-notFound";
      document.querySelector('#filesError').classList.remove('d-none');
      const errorMessageHTML = `
        <div class="col-auto text-center mt-5">
          <div class="alert alert-secondary border border-danger text-white">
            <i class="bi bi-exclamation-circle me-2 text-danger"></i>This folder was not found
          </div>
        </div>`;
      return document.querySelector("#filesError").innerHTML = errorMessageHTML;
    }
    if(getContentResult.status != "ok") {
      mainFolderObject.error = getContentResult.status
      document.querySelector('#filesError').classList.remove('d-none');
			return document.querySelector('#filesError').innerHTML = '<div class="col-auto"><div class="alert alert-secondary border border-danger text-white"><i class="bi bi-exclamation-circle me-2 text-danger"></i>An error has occurred<br>'+getContentResult.status+'</div></div>';
    }

    mainFolderObject = getContentResult.data

    if(mainFolderObject.canAccess == false && mainFolderObject.public == false) {
      mainFolderObject.error = "error-notPublic"
      document.querySelector("#filesError").classList.remove("d-none");
			return document.querySelector("#filesError").innerHTML = '<div class="col-auto"><div class="alert alert-secondary border border-warning text-white"><i class="bi bi-exclamation-circle me-2 text-warning"></i>This folder is not public</div></div>';
    }
    if(mainFolderObject.canAccess == false && mainFolderObject.expire) {
      mainFolderObject.error = "error-expired"
      document.querySelector("#filesError").classList.remove("d-none");
			return document.querySelector("#filesError").innerHTML = '<div class="col-auto"><div class="alert alert-secondary border border-warning text-white"><i class="bi bi-exclamation-circle me-2 text-warning"></i>This folder has expired</div></div>';
    }
    if(mainFolderObject.canAccess == false && mainFolderObject.password == true && mainFolderObject.passwordStatus != "passwordOk") {
      mainFolderObject.error = "error-password"
      document.querySelector("#filesError").classList.remove("d-none");
			document.querySelector("#filesError").innerHTML = '<div class="col-auto"><div class="alert alert-secondary border border-info text-white"><i class="bi bi-exclamation-circle me-2 text-info"></i>Password required</div></div>';
      var tempHTML = `
      <form class="row justify-content-center">
        <div class="col-auto ">
          <input type="password" class="form-control" id="filesErrorPasswordInput" placeholder="Password">
        </div>
        <div class="col-auto">
          <button type="submit" class="btn btn-primary" id="filesErrorPasswordButton">Send</button>
        </div>
      </form>
      `
      return document.querySelector("#filesError").innerHTML += tempHTML;
    }
    if(mainFolderObject.type && mainFolderObject.type == "file"){
      mainFolderObject.error = "error-type"
      document.querySelector('#filesError').classList.remove('d-none');
			return document.querySelector('#filesError').innerHTML = '<div class="col-auto"><div class="alert alert-secondary border border-warning text-white"><i class="bi bi-exclamation-circle me-2 text-warning"></i>Must be a folder</div></div>';
    }
    
		//Manage webrisk positive result
		if(mainFolderObject.webrisk && mainFolderObject.webrisk.threatTypes)
		{
			document.querySelector('#filesError').classList.remove('d-none');
			return document.querySelector('#filesError').innerHTML = '<div class="col-auto"><div class="alert alert-secondary border border-danger text-white"><i class="bi bi-exclamation-circle me-2 text-danger"></i>This folder has been detected as suspicious. If you think this is a mistake, contact us.</div></div>';
		}

		if(mainFolderObject.code && mainFolderObject.public == true)
		{
			history.replaceState(null, '', 'https://' + window.location.hostname + '/d/'+mainFolderObject.code)
		}

		loadTableFromFolderResult(sessionStorage[mainFolderObject.id+'|sort'])

		if(sessionStorage.getItem('toCopy') != undefined)
		{
			document.querySelector("#filesContentToolbarCopyHere").classList.remove("d-none");
			document.querySelector("#filesContentToolbarCancelCopyHere").classList.remove("d-none");
			document.querySelector("#filesContentToolbarCopyHereCount").innerHTML = sessionStorage.getItem("toCopy").split(",").length;
			document.querySelectorAll(".filesContentOptionCopyHere").forEach(function(element) {
				element.classList.remove("d-none");
			});
		}

    if(sessionStorage.getItem('toMove') != undefined)
		{
			document.querySelector("#filesContentToolbarMoveHere").classList.remove("d-none");
			document.querySelector("#filesContentToolbarCancelMoveHere").classList.remove("d-none");
			document.querySelector("#filesContentToolbarMoveHereCount").innerHTML = sessionStorage.getItem("toMove").split(",").length;
			document.querySelectorAll(".filesContentOptionMoveHere").forEach(function(element) {
				element.classList.remove("d-none");
			});
		}

		if(sessionStorage.getItem("showSuccess") == "true")
		{
			document.querySelector('#filesSuccessDownloadLink').setAttribute('href', "https://" + window.location.hostname + "/d/" + mainFolderObject.code);
			document.querySelector('#filesSuccessDownloadLink').parentElement.querySelector("button").setAttribute("data-copyText","https://" + window.location.hostname + "/d/" + mainFolderObject.code);
			document.querySelector('#filesSuccessDownloadLink').innerHTML = "https://" + window.location.hostname + "/d/" + mainFolderObject.code;

      new QRCode("filesSuccessQR", {
        text: "https://" + window.location.hostname + "/d/" + mainFolderObject.code,
        width: 128,
        height: 128,
      });

      if(accountsObject[accountActive].tier != "donor" && accountsObject[accountActive].tier != "premium")
      {
      	document.querySelector('#filesSuccessNotPremWarn').classList.remove('d-none');
      }

      document.querySelector('#filesSuccess').classList.remove('d-none');
      sessionStorage.removeItem('showSuccess')
		}
		else
		{
			document.querySelector('#filesContent').classList.remove('d-none');
		}
	}
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  });
}
async function afterPageProfileLoad() {
  document.querySelector(".profileIcon").setAttribute("src", accountsObject[accountActive].icon.toDataURL());
  document.querySelector(".profileAccountEmail").innerHTML = accountActive;
  document.querySelector(".profileAccountTier").innerHTML = accountsObject[accountActive].tier;
  if(accountsObject[accountActive].tier == "guest" || accountsObject[accountActive].tier == "standard") {

  }

  if(accountsObject[accountActive].tier == "premium" && accountsObject[accountActive].premiumType == "credit") {
    document.querySelector(".profileAccountPremiumMethod").innerHTML = "Pay per use"
    document.querySelectorAll(".profileAccountPremiumMethodCredit").forEach(element => element.classList.remove("d-none"));

    document.querySelector(".profileAccountCreditBalanceRow").classList.remove("d-none");
    document.querySelector(".profileAccountCreditBalanceRow + hr").classList.remove("d-none");
    document.querySelector(".profileAccountCreditBalance").innerHTML = accountsObject[accountActive].credit+accountsObject[accountActive].currencySign

    document.querySelector(".profileAccountPremiumTraffic30DaysCreditText").classList.remove("d-none");
    document.querySelector(".profileAccountPremiumTraffic30Days").innerHTML = humanFileSize(getPremiumTrafficLastXDays(accountActive,30), true)
  } else if(accountsObject[accountActive].tier == "premium" && accountsObject[accountActive].premiumType == "subscription") {
    document.querySelector(".profileAccountPremiumMethod").innerHTML = "Subscription"
    if(accountsObject[accountActive].subscriptionProvider == "patreon") {
      document.querySelectorAll(".profileAccountPremiumMethodPatreon").forEach(element => element.classList.remove("d-none"));
    }

    if(accountsObject[accountActive].subscriptionEndDate != 9999999999) {
      document.querySelector(".profileAccountPremiumEndDateRow").classList.remove("d-none");
      document.querySelector(".profileAccountPremiumEndDateRow + hr").classList.remove("d-none");
      document.querySelector(".profileAccountPremiumEndDate").innerHTML = new Date(accountsObject[accountActive].subscriptionEndDate * 1000).toLocaleDateString();
    }

    document.querySelector(".profileAccountSubscriptionLimitStorage").innerHTML = humanFileSize(accountsObject[accountActive].subscriptionLimitStorage, true)
    document.querySelector(".profileAccountStorageUsedSubscriptionText").classList.remove("d-none");

    document.querySelector(".profileAccountSubscriptionLimitDirectTraffic").innerHTML = humanFileSize(accountsObject[accountActive].subscriptionLimitDirectTraffic, true)
    document.querySelector(".profileAccountPremiumTraffic30DaysSubscriptionText").classList.remove("d-none");
    document.querySelector(".profileAccountPremiumTraffic30Days").innerHTML = humanFileSize(getPremiumTrafficLastXDays(accountActive,30), true)
  }

  document.querySelector(".profileAccountStorageUsed").innerHTML = humanFileSize(accountsObject[accountActive].statsCurrent.storage, true)

  document.querySelector(".profileAccountId").innerHTML = accountsObject[accountActive].id
  document.querySelector(".profileAccountToken").innerHTML = accountsObject[accountActive].token
}
async function afterPageApiLoad() {
  if (prismLoaded == false) {
    var cssToAdd = document.createElement('link');
    cssToAdd.setAttribute('rel', 'stylesheet');
    cssToAdd.setAttribute('href', '/dist/css/prism.css');
    document.head.appendChild(cssToAdd);

    var jsToAdd = document.createElement('script');
    jsToAdd.setAttribute('src', '/dist/js/prism.js');
    jsToAdd.setAttribute('data-manual', '');  // Add this line
    jsToAdd.onload = function() {
      prismLoaded = true;
    };
    document.head.appendChild(jsToAdd);
    
  }
  while(prismLoaded == false) {
    await sleep(100)
  }
  Prism.highlightAll()
}
async function afterPagePremiumLoad() {
  if(accountsObject[accountActive].tier == "premium"){
    if(accountsObject[accountActive].premiumType == "subscription") {
      if(accountsObject[accountActive].subscriptionProvider == "patreon") {
        document.querySelectorAll(".premiumSubscriptionPatreonAlert").forEach(element => element.classList.remove("d-none"));
      } else if(accountsObject[accountActive].subscriptionProvider == "internal") {
        document.querySelectorAll(".premiumSubscriptionAlert").forEach(element => element.classList.remove("d-none"));
        document.querySelector(".premiumSubscriptionAlertDate").innerHTML = new Date(accountsObject[accountActive].subscriptionEndDate * 1000).toLocaleDateString();
      }
    } else if(accountsObject[accountActive].premiumType == "credit") {
      document.querySelectorAll(".premiumCreditAlert").forEach(element => element.classList.remove("d-none"));
      document.querySelector(".premiumCreditAlertBalance").innerHTML = accountsObject[accountActive].credit+accountsObject[accountActive].currencySign
    }
  }
}
async function afterPageContactLoad() {
  if (accountsObject[accountActive].tier !== 'guest') {
    document.getElementById('contactFormEmail').value = accountsObject[accountActive].email;
  }
}
async function afterPageTestLoad() {
  if (location.hash === "#vi") {
    // document.getElementById("mainFooter").style.height = "130px"
    var adScript = document.createElement('script');
    adScript.setAttribute('src','//cdn.vlitag.com/w/ff2a5b40-a678-475a-99ce-cf5e86db0a1d.js');
    document.head.appendChild(adScript);
    var vitag = vitag || {};
    vitag.gdprShowConsentToolButton = false;
    var adScript = document.createElement('script');
    adScript.setAttribute('src','//cdn.vlitag.com/ata/adv/ff2a5b40-a678-475a-99ce-cf5e86db0a1d.js');
    document.head.appendChild(adScript);
    document.getElementById("testAads").innerHTML = '<div class="adsbyvli" data-ad-slot="pw_32951"></div>';
    const startTime = Date.now();
    while (window.vitag === undefined && Date.now() - startTime < 2000) {
        await sleep(100);
    }
    window.vitag && (vitag.Init = window.vitag.Init || []).push(() => viAPItag.display("pw_32951"));
  }
  else if (location.hash === "#clickadu") {
    var adScript = document.createElement('script');
    adScript.setAttribute('data-cfasync','false');
    adScript.setAttribute('class','__clb-2023524'); 
    adScript.setAttribute('src','//2ucz3ymr1.com/lv/esnk/2023524/code.js');
    document.getElementById("testAads").appendChild(adScript);
  }
  else if (location.hash === "#linkvertise") {    
    var adScript = document.createElement('script');
    adScript.setAttribute('src','https://integrate.linkvertise.com/serp-script.js');
    adScript.setAttribute('id','lv-ads'); 
    adScript.setAttribute('data-integration-id','2999'); 
    adScript.setAttribute('data-ad-number',1); 
    adScript.setAttribute('data-keyword',"minecraft"); 
    adScript.setAttribute('data-jsonp',"handleAds"); 
    document.head.appendChild(adScript);
  }
  else if (location.hash === "#aniview") {
    var adScript = document.createElement('script');
    adScript.setAttribute('id','AV65e059fa4b62007c550059e1');
    adScript.setAttribute('src','https://tg1.aniview.com/api/adserver/spt?AV_TAGID=65e059fa4b62007c550059e1&AV_PUBLISHERID=65cc7eab73378ab36101d626');
    document.head.appendChild(adScript);
    document.getElementById("adsATF").classList.remove("d-none");
  }
  else if (location.hash === "#mahimeta") {
    document.getElementById("testAads").innerHTML = '<ins class="adsbymahimeta" id="mMTag_Responsive_15666494" data-size="Responsive" data-desktop="300x250" data-tablet="300x250" data-mobile="300x250" style="display:inline-block;"></ins>';
    var cachebuster = Math.round(new Date().getTime() / 1000); 
    var mMTagScript = document.createElement('script'); 
    mMTagScript.src = '//mahimeta.com/networks/tag.js?cache='+cachebuster;
    document.getElementsByTagName("head")[0].appendChild(mMTagScript);
  }
  else {
    document.getElementById("testAads").innerHTML = "<iframe data-aa='2059298' src='//ad.a-ads.com/2059298?size=300x250' style='width:300px; height:250px; border:0px; padding:0; overflow:hidden; background-color: transparent;'></iframe>";
  }
}

function handleAds(ads) {
  //Fallback script
  console.log("handleAds")
  if(ads == undefined || ads[0] == undefined) {
    if(document.getElementById("adsATF").innerHTML == "")
    {
      document.getElementById("adsATF").innerHTML = '<small>To disable ads, <a href="/premium" class="ajaxLink">upgrade</a> your account to premium</small><br><iframe data-aa="2059298" src="//ad.a-ads.com/2059298?size=300x250" style="width:300px; height:250px; border:0px; padding:0; overflow:hidden; background-color: transparent;"></iframe>';
    }
    return
  }

  var ad = ads[0]
  document.getElementById("adsATF").innerHTML = `
  <div class="row">
      <div class="col-auto">
          <img class="img-fluid" src="${ad.thumbnail_url}" style="max-height:200px;"></img>
      </div>
      <div class="col text-start">
          <h4><a href="${ad.clickout_url}" target="_blank" title="ad title">${ad.title}</a></h4>
          <p id="ad-description">${ad.description}</p>
          <small>
              <i>
              <a href="${ad.clickout_url}" target="_blank" title="ad title" id="call-to-action" class="btn btn-warning rounded-pill">${ad.call_to_action}</a>
              </i>
          </small><br><hr>
          <small>To disable ads, <a href="/premium" class="ajaxLink">upgrade</a> your account to premium</small>
      </div>
  </div>
  `
}  

//App logic when DOM loaded
window.addEventListener('load', async function() {
  //Loading page
  // document.getElementById('loadingPage').classList.add("d-none")

  await startup()
  processURL()

  //sidebar toggle button
  document.getElementById("sidebar-toggle").addEventListener("click", function(e) {
		e.preventDefault();
    sidebarCollapse();
	});

  //Sidebar collaspse when clicking outside on mobile
  document.getElementById("mainContent").addEventListener("click", function() {
    if (document.body.offsetWidth < 992) {
      sidebarCollapse(0);
    }
  });


  const sidebarItems = document.querySelectorAll('.sidebarItem');
  sidebarItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
      this.classList.add('hover');
      this.style.backgroundColor = '#2b2b2b';
    });
    item.addEventListener('mouseleave', function() {
      this.style.backgroundColor = '';
    });
  });

  //Sidebar Close button on Mobile
  document.getElementById("sidebarMobileClose").addEventListener("click", function() {
		sidebarCollapse(0)
	});

  //Process browser back and forward
  window.onpopstate = async function(event) {
    processURL();
  };

  //Tracking code
  var adScript = document.createElement('script');
  adScript.setAttribute('data-domain','gofile.io');
  adScript.setAttribute('src','https://s.gofile.io/js/script.js');
  document.head.appendChild(adScript);
});
self.ro = ro;

}