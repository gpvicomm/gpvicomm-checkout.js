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


```html
<script src="https://cdn.gpvicomm.com/ccapi/sdk/payment_checkout_stable.min.js" charset="UTF-8"></script>

<button class="js-payment-checkout">Compra</button>


<script>    
  let paymentCheckout = new PaymentCheckout.modal({
      client_app_code: 'PAYMENT_CLIENT_APP_CODE', // Application Code de las credenciales CLIENT
      client_app_key: 'PAYMENT_CLIENT_APP_KEY', // Application Key de las credenciales CLIENT
      locale: 'es', // Idioma preferido del usuario (es, en, pt). El inglés se usará por defecto
      env_mode: 'stg', // `prod`, `stg`, `local` para cambiar de ambiente. Por defecto es `stg`
      onOpen: function() {
          console.log('Modal abierto');
      },
      onClose: function() {
          console.log('Modal cerrado');
      },
      onResponse: function(response) { // Funcionalidad a invocar cuando se completa el proceso de pago
          
          /*
            En caso de error, esta será la respuesta.
            response = {
              "error": {
                "type": "Server Error",
                "help": "Try Again Later",
                "description": "Sorry, there was a problem loading Checkout."
              }
            }

            Cual el usuario completa el flujo en el Checkout, esta será la respuesta
            response = {  
              "transaction":{  
                  "status":"success", // Estado de la transacción
                  "id":"PR-81011", // Id de la transacción de lado de la pasarela
                  "status_detail":3 // Para más detalles de los detalles de estado: https://developers.gpvicomm.com/api/#detalle-de-los-estados
              }
            }
          */
          console.log('Respuesta de modal');
          document.getElementById('response').innerHTML = JSON.stringify(response);            
      }
  });

  let btnOpenCheckout = document.querySelector('.js-payment-checkout');
  btnOpenCheckout.addEventListener('click', function(){
    // Open Checkout with further options:
    paymentCheckout.open({
      user_id: '1234',
      user_email: 'dev@gpvicomm.com', // Opcional        
      user_phone: '7777777777', // Opcional
      order_description: '1 Green Salad',
      order_amount: 1500,
      order_vat: 0,
      order_reference: '#234323411',
      //order_installments_type: 2, // Opcional: 0 para permitir cuotas, -1 en caso contrario.
      //conf_exclusive_types: 'ak,ex', // Opcional: Tipos de tarjeta permitidos para esta operación. Opciones: https://developers.gpvicomm.com/api/#metodos-de-pago-tarjetas-marcas-de-tarjetas
      //conf_invalid_card_type_message: 'Tarjeta invalida para esta operación' // Opcional: Define un mensaje personalizado para mostrar para los tipos de tarjeta no válidos.
    });
  });
  
  // Cerrar el Checkout en la navegación de la página:
  window.addEventListener('popstate', function() {
    paymentCheckout.close();
  });
</script>

```

## Opciones de configuración

Cambia la apariencia y el comportamiento de Checkout con las siguientes opciones de configuración.

### PaymentCheckout.modal

| Parámetro       | Requerido | Descripción                                                                                             |
|-----------------|----------|----------------------------------------------------------------------------------------------------------|
| client_app_code | sí       | Application Code de las credenciales CLIENT                                                              |
| client_app_key  | sí       | Application KEY de las credenciales CLIENT                                                               |
| env_mode        | sí       | `prod`, `stg`, `local` para cambiar de ambiente. Por defecto es `stg`                                    |
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
| Parámetro                      | Requerido | Descripción                                                                                                                                               |
|--------------------------------|----|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| user_id                        | sí | Identificador del cliente Este es el identificador que usa dentro de su aplicación.                                                                              |
| user_email                     | no | Si ya conoces la dirección de correo electrónico de tu usuario, puedes proporcionarla al Checkout para que se complete previamente.                              |
| user_phone                     | no | Si ya conoces el teléfono de tu usuario, puedes proporcionarlo al Checkout para que se complete previamente.                                                     |
| order_description              | sí | Una descripción del producto o servicio que se compra.                                                                                                           |
| order_amount                   | sí | La cantidad que se muestra al usuario. Formato: decimal con dos dígitos de fracción.                                                                             |
| order_vat                      | sí | Importe del impuesto sobre las ventas, incluido en el costo del producto. Formato: decimal con dos dígitos de fracción.                                          |
| order_reference                | sí | Referencia de pedido de comerciante. Identificarás esta compra utilizando esta referencia.                                                                       |
| order_installments_type        | no | 0 para permitir cuotas, -1 en caso contrario.
|
| conf_exclusive_types           | no | Tipos de tarjeta permitidos para esta operación. Opciones: https://developers.gpvicomm.com/api/#metodos-de-pago-tarjetas-marcas-de-tarjetas                  
|
| conf_invalid_card_type_message | no | Define un mensaje personalizado para mostrar para los tipos de tarjeta no válidos.                                                                               |


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
