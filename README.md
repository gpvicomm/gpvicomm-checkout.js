# Global Payments ViComm Checkout

## Integrating Checkout


Global Payments ViComm Checkout, simplifica el procesamiento de pagos en línea de manera segura. Integra rápidamente el Checkout en su sitio para
 proporcionar a sus usuarios una solución optimizada, ofreciendo una experiencia de pago preparada para dispositivos móviles que mejora 
 constantemente.

La forma más fácil de integrar Global Payments ViComm es a través de Checkout, una herramienta integrada que se encarga de crear un formulario HTML, 
validar la entrada del usuario y proteger los datos de la tarjeta de sus clientes. Al usar Checkout, la información confidencial de la 
tarjeta de crédito se envía directamente a Global Payments ViComm y no toca tu servidor. Global Payments ViComm devuelve a tu sitio un objeto de 
transacción con el resultado de la operación.


Para ver el Checkout en acción, haz clic en el botón de arriba y completa el formulario con:

* Cualquier dirección de correo electrónico aleatoria y sintácticamente válida (cuanto más aleatoria, mejor)
* Cualquier número de teléfono, como 777777777
* Nombre de cualquier titular de tarjeta
* Uno de los [números de tarjeta de prueba](https://developers.gpvicomm.com/api/#tarjetas-de-prueba), como 4111111111111111
* Cualquier código CVC de tres dígitos
* Cualquier fecha de vencimiento a futuro

[Ver ejemplo de trabajo](https://developers.gpvicomm.com/docs/payments/#checkout)


## Integración

La integración personalizada requiere habilidades sólidas de JavaScript.

Cuando se carga su página, debe crear un objeto controlador utilizando `paymentCheckout.modal()`. Luego puede llamar la función `open()` en el 
controlador en respuesta a cualquier evento. Si necesita abortar el proceso de pago, por ejemplo, cuando la navegación ocurre en una 
aplicación de una sola página, llame la función `close()` en el controlador.


``` html
<!DOCTYPE html>
<html>
<head>
  <title>Example | Payment Checkout Js</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.gpvicomm.com/ccapi/sdk/payment_checkout_3.1.0.min.js" charset="UTF-8"></script>
</head>
<body>
<button class="js-payment-checkout">Pay with Card</button>
<div id="response"></div>

<script>
  let paymentCheckout = new PaymentCheckout.modal({
    env_mode: 'stg', // `prod`, `stg`: to change environment. Default is `stg`
    onOpen: function () {
      console.log('modal open');
    },
    onClose: function () {
      console.log('modal closed');
    },
    onResponse: function (response) { // The callback to invoke when the Checkout process is completed

      /*
        In Case of an error, this will be the response.
        response = {
          "error": {
            "type": "Server Error",
            "help": "Try Again Later",
            "description": "Sorry, there was a problem loading Checkout."
          }
        }

        When the User completes all the Flow in the Checkout, this will be the response.
        response = {
          "transaction":{
              "status": "success", // success or failure
              "id": "PR-10002", // transaction_id
              "status_detail": 3 // for the status detail please refer to: https://developers.gpvicomm.com/api/#detalle-de-los-estados
          }
        }
      */
      console.log('modal response');
      document.getElementById('response').innerHTML = JSON.stringify(response);
    }
  });

  let btnOpenCheckout = document.querySelector('.js-payment-checkout');
  btnOpenCheckout.addEventListener('click', function () {
    paymentCheckout.open({
      reference: '8REV4qMyQP3w4xGmANA' // reference received for Payment Gateway
    });
  });

  window.addEventListener('popstate', function () {
    paymentCheckout.close();
  });
</script>
</body>
</html>


```

## Opciones de configuración

Cambia la apariencia y el comportamiento de Checkout con las siguientes opciones de configuración.

### PaymentCheckout.modal

| Parámetro       | Requerido | Descripción                                                                                             |
|-----------------|----------|----------------------------------------------------------------------------------------------------------|
| locale          | no       | Idioma preferido del usuario (es, en, pt). El inglés se usará por defecto                                |
| onOpen          | no       | `function()` Callback a invocar cuando el Checkout es abierto                                            |
| onClose         | no       | `function()` Callback a invocar cuando el Checkout es cerrado                                            |
| onResponse      | sí       | function([responseObject](#objeto-de-respuesta)) Callback a invocar cuando el proceso del Checkout es completado |

#### Objeto de respuesta

Cuando el usuario complete todo el flujo en el proceso de pago, esta será la respuesta.
```javascript
{  
  "transaction": {  
    "status": "success", // Estado de la transacción
    "id": "PR-81011", // Id de la transacción de lado de la pasarela
    "status_detail": 3 // Para más detalles de los detalles de estado: https://developers.gpvicomm.com/api/#detalle-de-los-estados
  }
}
```

En caso de error, esta será la respuesta.
```javascript
{
  "error": {
    "type": "Server Error",
    "help": "Try Again Later",
    "description": "Sorry, there was a problem loading Checkout."
  }
}
```


### PaymentCheckout.open
| Parametro | Requerido | Descripcion                                                                                                            |
|-----------|-----------|------------------------------------------------------------------------------------------------------------------------|
| reference | sí        | Reference transaction. Se obtiene esta referencia al llamar al servicio init transaction.|

### Generar Referencia
Antes de invocar el checkout, se debe generar una referencia con los datos del pago, ver https://developers.gpvicomm.com/api/#metodos-de-pago-tarjetas-inicializar-una-referencia


## Requisitos HTTPS

Todos los envíos de información de pago mediante Checkout se realizan a través de una conexión HTTPS segura. Sin embargo, para protegerse de
 ciertas formas de ataques man-in-the-middle, también debe servir la página que contiene el formulario de pago a través de HTTPS. En resumen, 
 la dirección de la página que contiene Checkout debe comenzar con `https: //` en lugar de solo `http: //`.

## Navegadores compatibles

Checkout se esfuerza por admitir todas las versiones recientes de los principales navegadores. Por razones de seguridad y para proporcionar la mejor experiencia a la mayoría de los clientes, no admitimos navegadores que ya no reciben actualizaciones de seguridad y representan una pequeña minoría de tráfico.


## Evitar que se bloquee Checkout

Puede evitar que se bloquee la ventana emergente de Checkout llamando a `paymentCheckout.open` cuando el usuario hace clic en un elemento de
 la página. No llames a `paymentCheckout.open` dentro de un callback. Este diseño indica al navegador que el usuario está solicitando 
 explícitamente la ventana emergente. De lo contrario, los dispositivos móviles y algunas versiones de Internet Explorer bloquearán la 
 ventana emergente y evitarán que el uso adecuado por el cliente.
