(function () {
  const domain = "pg__gateway_domain__";
  let listServers = [
    "http://localhost:3000",
    "http://localhost:8080",
    `https://ccapi-dev.${domain}`,
    `https://ccapi-stg.${domain}`,
    `https://ccapi-qa.${domain}`,
    `https://ccapi.${domain}`
  ];
  window.addEventListener("message", function (event) {
    if (new RegExp(listServers.join("|")).test(event.origin)) {
      if (event.data === "close-payment-popup") {
        document
          .querySelectorAll(".payment-checkout-modal__closeIcon")[0]
          .click();
      }
      if (event.data === "resize-payment-popup") {
        let el = document; // This can be your element on which to trigger the event
        let event = document.createEvent("HTMLEvents");
        event.initEvent("resize", true, false);
        el.dispatchEvent(event);
      }
    } else {
      return;
    }
  });
})();
