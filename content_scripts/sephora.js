console.log('Taro content script loaded successfully!');

function createPopup(content) {
  // Check if a popup already exists and remove it
  const existingPopup = document.getElementById('harmfulIngredientsPopup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create a new popup
  const popup = document.createElement('div');
  popup.setAttribute('id', 'harmfulIngredientsPopup');
  popup.style.position = 'fixed';
  popup.style.left = '50%';
  popup.style.top = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.zIndex = '9999';
  popup.style.width = '250px';  // Adjust the size to fit your image
  popup.style.height = '400px'; // Adjust the height accordingly
  popup.style.backgroundSize = 'cover';
  popup.style.backgroundColor = 'rgba(0,0,0,0.8)';
  popup.style.borderRadius = '15px';
  popup.style.boxShadow = '0px 0px 20px rgba(0,0,0,0.5)';
  popup.style.color = '#FFFFFF'; // Ensure text color contrasts well with the image
  popup.style.display = 'flex';
  popup.style.flexDirection = 'column';
  popup.style.justifyContent = 'flex-end';
  popup.style.padding = '20px';
  popup.style.fontSize = '16px'; // Adjust font size as needed
  popup.style.textAlign = 'left';

  const imageContainer = document.createElement('div');
  imageContainer.style.width = '100px';
  imageContainer.style.height = '100px';
  imageContainer.style.backgroundImage = 'url("' + chrome.extension.getURL('taro_image.png') + '")';
  imageContainer.style.backgroundRepeat = 'no-repeat';
  imageContainer.style.backgroundPosition = 'center';
  imageContainer.style.backgroundSize = '100px 100px';

  popup.appendChild(imageContainer);


  popup.innerHTML = `<h1>Warning!</h1><p>${content}</p>`;

  


  // Close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '10px';
  closeButton.style.right = '10px';
  closeButton.style.padding = '5px 10px';
  closeButton.style.background = 'red';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '50%';
  closeButton.style.fontSize = '16px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = function() {
    popup.remove();
  };
  popup.appendChild(closeButton);

  document.body.appendChild(popup);
}

document.addEventListener('DetectedHarmfulIngredients', function(e) {
  createPopup(e.detail.content);
});
function injectScript() {
  document.addEventListener('DOMContentLoaded', function () {
    const script = document.createElement('script');
    script.textContent = `
      (() => {
        function removeHtmlTags(htmlString) {
          return htmlString.replace(/<\\/?[^>]+(>|$)/g, "").replace(/\\s\\s+/g, ' ').trim();
        }

        function checkHarmfulIngredients(ingredients) {
          const harmfulIngredients = [
            'Retinoids', 'Retinols', 'Hydroquinon', 'Retin A', 'aluminium chloride', 'phthalates', 
            'Amphetamines', 'Sodium benzoate', 'Benzophenone', 'Octinoxate', 'Paraffin Oil', 'acrylamide', 
            'retinyl palmitate', 'Pyridine', 'hydrogenated cotton seed oil', 'Progestins', 'Urea', 
            'Polyethylene Glycol', 'Formaldehyde', 'Butylated hydroxyanisole', 'butylated hydroxytoluene', 
            'Potassium bromate', 'Propyl gallate', 'Lead'
          ];
          let count = 0;
          harmfulIngredients.forEach(ingredient => {
            if (ingredients.toLowerCase().includes(ingredient.toLowerCase())) {
              count++;
            }
          });
          return count;
        }

        const originalFetch = window.fetch;
        window.fetch = function() {
          const promise = originalFetch.apply(this, arguments);
          promise.then(res => {
            if (res.url.includes('/catalog/products/')) {
              res.clone().json().then(data => {
                data.regularChildSkus.forEach(sku => {
                  const cleanIngredients = removeHtmlTags(sku.ingredientDesc);
                  const count = checkHarmfulIngredients(cleanIngredients);
                  if (count > 0) {
                    const content = 'Found ' + count + ' harmful ingredients in ' + data.productDetails.displayName;
                    const event = new CustomEvent('DetectedHarmfulIngredients', { detail: { content: content } });
                    document.dispatchEvent(event);
                  }
                });
              }).catch(err => console.error('Fetch error:', err));
            }
          });
          return promise;
        };

        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function() {
          this.addEventListener('load', function() {
            if (this.responseURL.includes('/catalog/products/')) {
              const data = JSON.parse(this.responseText);
              data.regularChildSkus.forEach(sku => {
                const cleanIngredients = removeHtmlTags(sku.ingredientDesc);
                const count = checkHarmfulIngredients(cleanIngredients);
                if (count > 0) {
                  const content = 'Found ' + count + ' harmful ingredients in ' + data.productDetails.displayName;
                  const event = new CustomEvent('DetectedHarmfulIngredients', { detail: { content: content } });
                  document.dispatchEvent(event);
                }
              });
            }
          });
          originalSend.apply(this, arguments);
        };
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();
  });
}

injectScript();
