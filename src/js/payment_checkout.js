/*!
* payment_checkout.js
* @author  Developer Team
*/
(function (root, factory) {
  let cssId = 'paymentCheckoutCss';  // you could encode the css path itself to generate id
  if (!document.getElementById(cssId)) {
    let head = document.getElementsByTagName('head')[0];
    let link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'https://cdn.pg__gateway_domain__/ccapi/sdk/payment_checkout_stable.min.css';
    link.media = 'all';
    head.appendChild(link);
  }

  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.PaymentCheckout = factory();
  }
}(this, function () {

  /* ----------------------------------------------------------- */
  /* == modal */
  /* ----------------------------------------------------------- */

  let transitionEvent = whichTransitionEvent();

  function Modal(options) {

    let defaults = {
      client_app_code: null,
      client_app_key: null,
      env_mode: null,
      locale: "en",
      onClose: null,
      onOpen: null,
      onResponse: null,
      beforeOpen: null,
      beforeClose: null,
      stickyFooter: false,
      footer: false,
      cssClass: [],
      closeLabel: '',
      loadingLabel: '',
      errorLabel: '',
      closeMethods: ['overlay', 'button', 'escape']
    };

    // extends config
    this.opts = extend({}, defaults, options);
    this.DOMAIN = "pg__gateway_domain__";

    this.SERVER_LOCAL_URL = "http://localhost:8080";
    this.SERVER_DEV_URL = `https://ccapi-dev.${this.DOMAIN}`;
    this.SERVER_STG_URL = `https://ccapi-stg.${this.DOMAIN}`;
    this.SERVER_QA_URL = `https://ccapi-qa.${this.DOMAIN}`;
    this.SERVER_PROD_URL = `https://ccapi.${this.DOMAIN}`;
    this.PG_MICROS_STAGING = `https://pg-micros-stg.${this.DOMAIN}/v1/unixtime/`;
    this.PG_MICROS_PRODUCTION = `https://pg-micros.${this.DOMAIN}/v1/unixtime/`;

    // init modal
    this.init();
  }


  Modal.prototype.init = function () {
    let self = this;
    if (this.modal) {
      return;
    }

    if (self.opts.locale === 'pt') {
      self.opts.closeLabel = 'Fechar';
      self.opts.loadingLabel = 'Carregando...';
      self.opts.errorLabel = 'Desculpe, houve um problema ao carregar o Checkout: ';
    } else if (self.opts.locale === 'es') {
      self.opts.closeLabel = 'Cerrar';
      self.opts.loadingLabel = 'Cargando...';
      self.opts.errorLabel = 'Disculpe, se produjo un problema cargando el Checkout: ';
    } else {
      self.opts.closeLabel = 'Close';
      self.opts.loadingLabel = 'Loading...';
      self.opts.errorLabel = 'Sorry, there was a problem loading Checkout: ';
    }

    _build.call(this);
    _bindEvents.call(this);

    // insert modal in dom
    document.body.insertBefore(this.modal, document.body.firstChild);

    if (this.opts.footer) {
      this.addFooter();
    }
  };

  Modal.prototype.destroy = function () {
    if (this.modal === null) {
      return;
    }

    // unbind all events
    _unbindEvents.call(this);

    // remove modal from dom
    this.modal.parentNode.removeChild(this.modal);

    this.modal = null;
  };

  Modal.prototype.open = function (orderRequest) {
    let self = this;

    // before open callback
    if (typeof self.opts.beforeOpen === 'function') {
      self.opts.beforeOpen();
    }

    if (this.modal.style.removeProperty) {
      this.modal.style.removeProperty('display');
    } else {
      this.modal.style.removeAttribute('display');
    }

    // prevent double scroll
    document.body.classList.add('payment-checkout-enabled');

    // sticky footer
    this.setStickyFooter(this.opts.stickyFooter);

    // show modal
    this.modal.classList.add('payment-checkout-modal--visible');
    this.modalBoxContent.innerHTML = '<div class="payment_dialog_info"><i class="fa fa-times-circle"></i><span>' + self.opts.loadingLabel + '</span></div>';

    let installments_type = -1;
    if (parseInt(orderRequest['order_installments_type']) >= 0) {
      installments_type = orderRequest['order_installments_type'];
    }

    let default_theme = {
      primary_color: "pg__primary_color__",
      secondary_color: "pg__secondary_color__",
      logo: "https://cdn.pg__gateway_domain__/ccapi/image/logo.png",
      background_image: null
    };

    let params = {
      session_id: _getSessionId(),
      locale: self.opts.locale,
      user: {
        id: orderRequest['user_id'],
        email: orderRequest['user_email'],
        phone: orderRequest['user_phone']
      },
      order: {
        amount: orderRequest['order_amount'],
        description: orderRequest['order_description'],
        vat: orderRequest['order_vat'],
        dev_reference: orderRequest['order_reference'],
        installments_type: installments_type,
      },
      conf: {
        exclusive_types: orderRequest['conf_exclusive_types'],
        invalid_card_type_message: orderRequest['conf_invalid_card_type_message'],
        style_version: orderRequest["style_version"] || "2",
        theme: orderRequest["theme"] || default_theme
      }
    };
    let taxable_amount = orderRequest['order_taxable_amount'];
    if (taxable_amount !== undefined && taxable_amount !== null && taxable_amount >= 0) {
      params['order']['taxable_amount'] = taxable_amount;
    }

    let tax_percentage = orderRequest['order_tax_percentage'];
    if (tax_percentage !== undefined && tax_percentage !== null && tax_percentage >= 0) {
      params['order']['tax_percentage'] = tax_percentage;
    }

    _initCheckout.call(this, params, function success(checkout_response) {
      self.openModal(checkout_response['checkout_url']);
    }, function error(error_response) {
      self.modalBoxContent.innerHTML = '<div class="payment_dialog_error"><i class="fa fa-times-circle"></i><span>' + self.opts.errorLabel + error_response.error.type + '</span></div>';
    });


    if (transitionEvent) {
      this.modal.addEventListener(transitionEvent, function handler() {
        if (typeof self.opts.onOpen === 'function') {
          self.opts.onOpen.call(self);
        }

        // detach event after transition end (so it doesn't fire multiple onOpen)
        self.modal.removeEventListener(transitionEvent, handler, false);

      }, false);
    } else {
      if (typeof self.opts.onOpen === 'function') {
        self.opts.onOpen.call(self);
      }
    }

    // check if modal is bigger than screen height
    this.checkOverflow();

  };

  Modal.prototype.openModal = function (iframe_url) {
    let self = this;
    this.modalBoxContent.innerHTML = "";
    let content = document.createElement('iframe');
    content.setAttribute("id", "modalBoxContentPaymentCheckout");
    content.setAttribute("scrolling", "no");
    content.setAttribute("width", "100%");
    content.setAttribute("frameBorder", "0");
    content.setAttribute("padding", "0");
    content.setAttribute("margin", "0");
    content.setAttribute("src", iframe_url);
    this.modalBoxContent.appendChild(content);

    // check if modal is bigger than screen height
    this.checkOverflow();
    iFrameResize({
      log: false,
      checkOrigin: false,
      messageCallback: function (messageData) { // Callback fn when message is received
        if (typeof self.opts.onResponse === "function") {
          self.opts.onResponse.call(this, messageData.message);
          self.close();
        }
      },
    }, '#modalBoxContentPaymentCheckout');
  };

  Modal.prototype.isOpen = function () {
    return !!this.modal.classList.contains("payment-checkout-modal--visible");
  };

  Modal.prototype.close = function () {
    //  before close
    if (typeof this.opts.beforeClose === "function") {
      let close = this.opts.beforeClose.call(this);
      if (!close) return;
    }

    document.body.classList.remove('payment-checkout-enabled');

    this.modal.classList.remove('payment-checkout-modal--visible');

    //Using similar setup as onOpen
    //Reference to the Modal that's created
    let self = this;

    if (transitionEvent) {
      //Track when transition is happening then run onClose on compvare
      this.modal.addEventListener(transitionEvent, function handler() {
        // detach event after transition end (so it doesn't fire multiple onClose)
        self.modal.removeEventListener(transitionEvent, handler, false);

        self.modal.style.display = 'none';

        // on close callback
        if (typeof self.opts.onClose === "function") {
          self.opts.onClose.call(this);
        }
      }, false);
    } else {
      self.modal.style.display = 'none';
      // on close callback
      if (typeof self.opts.onClose === "function") {
        self.opts.onClose.call(this);
      }
    }
  };

  Modal.prototype.setContent = function (content) {
    // check type of content : String or Node
    /*
    if (typeof content === 'string') {
        this.modalBoxContent.innerHTML = content;
    } else {
        this.modalBoxContent.innerHTML = "";
        this.modalBoxContent.appendChild(content);
    }*/
  };

  Modal.prototype.getContent = function () {
    return this.modalBoxContent;
  };

  Modal.prototype.addFooter = function () {
    // add footer to modal
    _buildFooter.call(this);
  };

  Modal.prototype.setFooterContent = function (content) {
    // set footer content
    this.modalBoxFooter.innerHTML = content;
  };

  Modal.prototype.getFooterContent = function () {
    return this.modalBoxFooter;
  };

  Modal.prototype.setStickyFooter = function (isSticky) {
    // if the modal is smaller than the viewport height, we don't need sticky
    if (!this.isOverflow()) {
      isSticky = false;
    }

    if (isSticky) {
      if (this.modalBox.contains(this.modalBoxFooter)) {
        this.modalBox.removeChild(this.modalBoxFooter);
        this.modal.appendChild(this.modalBoxFooter);
        this.modalBoxFooter.classList.add('payment-checkout-modal-box__footer--sticky');
        _recalculateFooterPosition.call(this);
        this.modalBoxContent.style['padding-bottom'] = this.modalBoxFooter.clientHeight + 20 + 'px';
      }
    } else if (this.modalBoxFooter) {
      if (!this.modalBox.contains(this.modalBoxFooter)) {
        this.modal.removeChild(this.modalBoxFooter);
        this.modalBox.appendChild(this.modalBoxFooter);
        this.modalBoxFooter.style.width = 'auto';
        this.modalBoxFooter.style.left = '';
        this.modalBoxContent.style['padding-bottom'] = '';
        this.modalBoxFooter.classList.remove('payment-checkout-modal-box__footer--sticky');
      }
    }
  };

  Modal.prototype.addFooterBtn = function (label, cssClass, callback) {
    let btn = document.createElement("button");

    // set label
    btn.innerHTML = label;

    // bind callback
    btn.addEventListener('click', callback);

    if (typeof cssClass === 'string' && cssClass.length) {
      // add classes to btn
      cssClass.split(" ").forEach(function (item) {
        btn.classList.add(item);
      });
    }

    this.modalBoxFooter.appendChild(btn);

    return btn;
  };

  Modal.prototype.resize = function () {
    console.warn('Resize is deprecated and will be removed in version 1.0');
  };

  Modal.prototype.isOverflow = function () {
    let viewportHeight = window.innerHeight;
    let modalHeight = this.modalBox.clientHeight;

    return modalHeight >= viewportHeight;
  };

  Modal.prototype.checkOverflow = function () {
    // only if the modal is currently shown
    if (this.modal.classList.contains('payment-checkout-modal--visible')) {
      if (this.isOverflow()) {
        this.modal.classList.add('payment-checkout-modal--overflow');
      } else {
        this.modal.classList.remove('payment-checkout-modal--overflow');
      }

      // TODO: remove offset
      //_offset.call(this);
      if (!this.isOverflow() && this.opts.stickyFooter) {
        this.setStickyFooter(false);
      } else if (this.isOverflow() && this.opts.stickyFooter) {
        _recalculateFooterPosition.call(this);
        this.setStickyFooter(true);
      }
    }
  };

  /* ----------------------------------------------------------- */
  /* == private methods */

  /* ----------------------------------------------------------- */

  function _uuidv4() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function _getSessionId() {
    return _uuidv4();
  }

  function _getUniqToken(auth_timestamp, payment_client_app_key) {
    let uniq_token_string = payment_client_app_key + auth_timestamp;
    return _getHash(uniq_token_string);
  }

  function _getAuthToken(payment_client_app_code, app_client_key, auth_timestamp) {
    let string_auth_token = payment_client_app_code + ";" + auth_timestamp + ";" + _getUniqToken(auth_timestamp, app_client_key);
    return btoa(string_auth_token);
  }

  function _getHash(message) {
    let sha256 = new jsSHA('SHA-256', 'TEXT');
    sha256.update(message);
    return sha256.getHash("HEX");
  }

  function _initCheckout(initCheckoutRequest, successCallback, erroCallback) {
    let SERVER_URL = this.SERVER_STG_URL;
    let TIME_STAMP_SERVER = this.PG_MICROS_STAGING;
    let auth_timestamp = String(Math.floor(new Date().getTime() / 1000));

    if (this.opts.env_mode === 'dev') {
      SERVER_URL = this.SERVER_DEV_URL;
      TIME_STAMP_SERVER = this.PG_MICROS_STAGING;
    } else if (this.opts.env_mode === 'local') {
      SERVER_URL = this.SERVER_LOCAL_URL;
      TIME_STAMP_SERVER = this.PG_MICROS_STAGING;
    } else if (this.opts.env_mode === 'stg') {
      SERVER_URL = this.SERVER_STG_URL;
      TIME_STAMP_SERVER = this.PG_MICROS_STAGING;
    } else if (this.opts.env_mode === 'prod') {
      SERVER_URL = this.SERVER_PROD_URL;
      TIME_STAMP_SERVER = this.PG_MICROS_PRODUCTION;
    } else if (this.opts.env_mode === 'prod-qa') {
      SERVER_URL = this.SERVER_QA_URL;
      TIME_STAMP_SERVER = this.PG_MICROS_PRODUCTION;
    } else {
      SERVER_URL = this.SERVER_STG_URL;
      TIME_STAMP_SERVER = this.PG_MICROS_STAGING;
    }

    // Get UnixTime
    try {
      let xhr = new XMLHttpRequest();
      xhr.open("GET", TIME_STAMP_SERVER, false);
      xhr.send();
      if (xhr.status >= 200 && xhr.status < 300) {
        let response = JSON.parse(xhr.responseText);
        if (response.unixtime) {
          auth_timestamp = String(response.unixtime);
        }
      } else {
        auth_timestamp = String(Math.floor(new Date().getTime() / 1000));
      }
    } catch (error) {
      auth_timestamp = String(Math.floor(new Date().getTime() / 1000));
    }
    //

    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", SERVER_URL + "/v2/transaction/init_checkout", true);
    xmlhttp.setRequestHeader("Content-Type", 'application/json');
    xmlhttp.setRequestHeader("Auth-Token", _getAuthToken(this.opts.client_app_code, this.opts.client_app_key, auth_timestamp));


    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState === XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
        try {
          let objResponse = JSON.parse(xmlhttp.responseText);
          if (xmlhttp.status === 200) {
            successCallback(objResponse);
          } else if (xmlhttp.status === 400) {
            erroCallback(objResponse);
          } else {
            erroCallback(objResponse);
          }
        } catch (e) {
          let server_error = {
            "error": {
              "type": "Server Error",
              "help": "Please Try Again Later",
              "description": "Something Went Wrong"
            }
          };
          erroCallback(server_error);
        }

      }
    };
    xmlhttp.send(JSON.stringify(initCheckoutRequest));
  }


  function _recalculateFooterPosition() {
    if (!this.modalBoxFooter) {
      return;
    }
    this.modalBoxFooter.style.width = this.modalBox.clientWidth + 'px';
    this.modalBoxFooter.style.left = this.modalBox.offsetLeft + 'px';
  }

  function _build() {
    // wrapper
    this.modal = document.createElement('div');
    this.modal.classList.add('payment-checkout-modal');

    // remove cusor if no overlay close method
    if (this.opts.closeMethods.length === 0 || this.opts.closeMethods.indexOf('overlay') === -1) {
      this.modal.classList.add('payment-checkout-modal--noOverlayClose');
    }

    this.modal.style.display = 'none';

    // custom class
    this.opts.cssClass.forEach(function (item) {
      if (typeof item === 'string') {
        this.modal.classList.add(item);
      }
    }, this);

    // close btn
    if (this.opts.closeMethods.indexOf('button') !== -1) {
      this.modalCloseBtn = document.createElement('button');
      this.modalCloseBtn.classList.add('payment-checkout-modal__close');

      this.modalCloseBtnIcon = document.createElement('span');
      this.modalCloseBtnIcon.classList.add('payment-checkout-modal__closeIcon');
      this.modalCloseBtnIcon.innerHTML = '×';

      this.modalCloseBtnLabel = document.createElement('span');
      this.modalCloseBtnLabel.classList.add('payment-checkout-modal__closeLabel');
      this.modalCloseBtnLabel.innerHTML = this.opts.closeLabel;

      this.modalCloseBtn.appendChild(this.modalCloseBtnIcon);
      this.modalCloseBtn.appendChild(this.modalCloseBtnLabel);
    }

    // modal
    this.modalBox = document.createElement('div');
    this.modalBox.classList.add('payment-checkout-modal-box');

    // modal box content
    this.modalBoxContent = document.createElement('div');
    this.modalBoxContent.classList.add('payment-checkout-modal-box__content');

    this.modalBox.appendChild(this.modalBoxContent);

    if (this.opts.closeMethods.indexOf('button') !== -1) {
      this.modal.appendChild(this.modalCloseBtn);
    }

    this.modal.appendChild(this.modalBox);


  }

  function _buildFooter() {
    this.modalBoxFooter = document.createElement('div');
    this.modalBoxFooter.classList.add('payment-checkout-modal-box__footer');
    this.modalBox.appendChild(this.modalBoxFooter);
  }

  function _bindEvents() {

    this._events = {
      clickCloseBtn: this.close.bind(this),
      clickOverlay: _handleClickOutside.bind(this),
      resize: this.checkOverflow.bind(this),
      keyboardNav: _handleKeyboardNav.bind(this)
    };

    if (this.opts.closeMethods.indexOf('button') !== -1) {
      this.modalCloseBtn.addEventListener('click', this._events.clickCloseBtn);
    }

    this.modal.addEventListener('mousedown', this._events.clickOverlay);
    window.addEventListener('resize', this._events.resize);
    document.addEventListener("keydown", this._events.keyboardNav);
  }

  function _handleKeyboardNav(event) {
    // escape key
    if (this.opts.closeMethods.indexOf('escape') !== -1 && event.which === 27 && this.isOpen()) {
      this.close();
    }
  }

  function _handleClickOutside(event) {
    // if click is outside the modal
    if (this.opts.closeMethods.indexOf('overlay') !== -1 && !_findAncestor(event.target, 'payment-checkout-modal') &&
      event.clientX < this.modal.clientWidth) {
      this.close();
    }
  }

  function _findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls)) ;
    return el;
  }

  function _unbindEvents() {
    if (this.opts.closeMethods.indexOf('button') !== -1) {
      this.modalCloseBtn.removeEventListener('click', this._events.clickCloseBtn);
    }
    this.modal.removeEventListener('mousedown', this._events.clickOverlay);
    window.removeEventListener('resize', this._events.resize);
    document.removeEventListener("keydown", this._events.keyboardNav);
  }

  /* ----------------------------------------------------------- */
  /* == confirm */
  /* ----------------------------------------------------------- */

  // coming soon

  /* ----------------------------------------------------------- */
  /* == alert */
  /* ----------------------------------------------------------- */

  // coming soon

  /* ----------------------------------------------------------- */
  /* == helpers */

  /* ----------------------------------------------------------- */

  function extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) {
          arguments[0][key] = arguments[i][key];
        }
      }
    }
    return arguments[0];
  }

  function whichTransitionEvent() {
    let t;
    let el = document.createElement('payment-checkout-test-transition');
    let transitions = {
      'transition': 'transitionend',
      'OTransition': 'oTransitionEnd',
      'MozTransition': 'transitionend',
      'WebkitTransition': 'webkitTransitionEnd'
    };

    for (t in transitions) {
      if (el.style[t] !== undefined) {
        return transitions[t];
      }
    }
  }

  /* ----------------------------------------------------------- */
  /* == return */
  /* ----------------------------------------------------------- */

  return {
    modal: Modal
  };

}));
