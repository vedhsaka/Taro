console.log('Taro content script loaded successfully!');
let minimizedIcon = null;

// Function to create a popup with expandable content
function createPopup(content, hasHarmfulIngredients) {
  // Check if a popup already exists and remove it
  const existingPopup = document.getElementById('harmfulIngredientsPopup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create the initial popup
  const popup = document.createElement('div');
  popup.setAttribute('id', 'harmfulIngredientsPopup');
  popup.style.position = 'fixed';
  popup.style.left = '50%';
  popup.style.top = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.zIndex = '9999';
  popup.style.width = '100px'; // Initial width for the image
  popup.style.height = '100px'; // Initial height for the image
  const imageUrl = hasHarmfulIngredients
  ? chrome.runtime.getURL('taro_image.png')
  : chrome.runtime.getURL('taro_icon.jpeg');
  popup.style.backgroundImage = 'url("' + imageUrl + '")';
  popup.style.backgroundSize = 'cover';
  popup.style.borderRadius = '50%';
  popup.style.boxShadow = '0px 0px 20px rgba(0,0,0,0.5)';
  popup.style.cursor = 'pointer';
  popup.style.display = 'flex';
  popup.style.justifyContent = 'center';
  popup.style.alignItems = 'center';
  popup.title = 'Click for details';

  // Expand functionality
  popup.addEventListener('click', function expandPopup() {
    popup.style.width = '300px';
    popup.style.height = '200px';
    popup.style.borderRadius = '15px';
    popup.style.background = 'white';  // Clear for text visibility
    popup.innerHTML = `<h1>Harmful Ingredients Detected</h1><p>${content}</p>`;
    popup.style.fontSize = '16px';
    popup.style.flexDirection = 'column';
    popup.style.padding = '10px';
    popup.onclick = null;  // Prevent re-triggering on click

    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '10px';
    closeButton.style.border = 'none';
    closeButton.style.background = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '24px';
    closeButton.style.color = 'black';
    closeButton.onclick = function() {
      popup.remove();
      createMinimizedIcon(content);  // Create minimized icon upon close
    };

    popup.appendChild(closeButton);
  });

  document.body.appendChild(popup);
}

function createMinimizedIcon(content) {
  minimizedIcon = document.createElement('div');
  minimizedIcon.style.position = 'fixed';
  minimizedIcon.style.bottom = '20px';
  minimizedIcon.style.right = '20px';
  minimizedIcon.style.width = '50px';
  minimizedIcon.style.height = '50px';
  minimizedIcon.style.backgroundImage = 'url("' + chrome.extension.getURL('taro_image.png') + '")';
  minimizedIcon.style.backgroundSize = 'cover';
  minimizedIcon.style.borderRadius = '50%';
  minimizedIcon.style.boxShadow = '0 4px 6px rgba(0,0,0,0.5)';
  minimizedIcon.style.cursor = 'pointer';
  minimizedIcon.style.zIndex = '10000';
  minimizedIcon.onclick = function() {
    createPopup(content);  // Re-create expanded popup on click
  };

  document.body.appendChild(minimizedIcon);
}

document.addEventListener('DetectedHarmfulIngredients', function(e) {
  console.log(e);
  createPopup(e.detail.content, true);
});


document.addEventListener('NoHarmfulIngredientsFound', function() {
  createPopup('No harmful ingredients found.', false);
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
                let hasHarmfulIngredients = false;
                data.regularChildSkus.forEach(sku => {
                  const cleanIngredients = removeHtmlTags(sku.ingredientDesc);
                  const count = checkHarmfulIngredients(cleanIngredients);
                  if (count > 0) {
                    hasHarmfulIngredients = true;
                    const content = 'Found ' + count + ' harmful ingredients in ' + data.productDetails.displayName;
                    const event = new CustomEvent('DetectedHarmfulIngredients', { detail: { content: content } });
                    document.dispatchEvent(event);
                  }
                });
                if (!hasHarmfulIngredients) {
                  const event = new CustomEvent('NoHarmfulIngredientsFound');
                  document.dispatchEvent(event);
                }
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
