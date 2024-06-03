console.log('Taro content script loaded successfully!');
let minimizedIcon = null;

<<<<<<< HEAD
// Function to create a popup with expandable content
function createPopup(content, hasHarmfulIngredients) {
  // Check if a popup already exists and remove it
=======
function createPopup(content) {
>>>>>>> 43c7f74 (Update)
  const existingPopup = document.getElementById('harmfulIngredientsPopup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.setAttribute('id', 'harmfulIngredientsPopup');
<<<<<<< HEAD
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
=======
  popup.style = 'position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 100px; height: 100px; background-image: url("' + chrome.runtime.getURL('taro_image.png') + '"); background-size: cover; border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.5); cursor: pointer; z-index: 10000;';
>>>>>>> 43c7f74 (Update)
  popup.title = 'Click for details';
  document.body.appendChild(popup);

  popup.addEventListener('click', function expandPopup() {
    this.style.width = '400px';
    this.style.height = '200px';
    this.style.borderRadius = '8px';
    this.style.background = '#FFFFFF';
    this.style.backgroundImage = '';
    this.innerHTML = '';

    const header = document.createElement('div');
    header.style = 'padding: 10px; background-color: #9C27B0; color: white; display: flex; justify-content: space-between; align-items: center;';

    const title = document.createElement('span');
    title.innerText = 'Detected Harmful Ingredients';
    title.style.fontWeight = 'bold';

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style = 'border: none; background: none; color: white; cursor: pointer; font-size: 24px;';
    closeButton.onclick = function() {
      popup.remove();
      if (!minimizedIcon) {
        createMinimizedIcon(content);
      }
    };

    header.appendChild(title);
    header.appendChild(closeButton);
    popup.appendChild(header);

    const body = document.createElement('div');
    body.style = 'padding: 20px; overflow-y: auto; background-color: white;';
    body.innerText = content;
    popup.appendChild(body);

    popup.removeEventListener('click', expandPopup);
  });
}

function createMinimizedIcon(content) {
  minimizedIcon = document.createElement('div');
  minimizedIcon.style = 'position: fixed; top: 35%; right: 20%; width: 50px; height: 50px; background-image: url("' + chrome.runtime.getURL('taro_image.png') + '"); background-size: cover; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.5); cursor: pointer; z-index: 10001;';
  minimizedIcon.onclick = function() {
    this.remove();
    minimizedIcon = null;
    createPopup(content);
  };

  document.body.appendChild(minimizedIcon);
}

document.addEventListener('DetectedHarmfulIngredients', function(e) {
  console.log(e);
  createMinimizedIcon(e.detail.content);
  createPopup(e.detail.content, true);
});


document.addEventListener('NoHarmfulIngredientsFound', function() {
  createPopup('No harmful ingredients found.', false);
});

function injectScript() {
  const script = document.createElement('script');
  script.textContent = `
    (() => {
      function removeHtmlTags(htmlString) {
        return htmlString.replace(/<\\/?[^>]+(>|$)/g, "").replace(/\\s\\s+/g, ' ').trim();
      }

      function checkIngredients(ingredients, ingredientsList) {
        let count = 0;
        ingredientsList.forEach(ingredient => {
          if (ingredients.toLowerCase().includes(ingredient.toLowerCase())) {
            count++;
          }
        });
        return count;
      }

      const level1Ingredients = [
        'Retinoids', 'Retinols', 'Hydroquinon', 'Retin A', 'aluminium chloride', 'phthalates', 
        'Amphetamines', 'Sodium benzoate', 'Benzophenone', 'Octinoxate', 'Paraffin Oil', 'acrylamide', 
        'retinyl palmitate', 'Pyridine', 'hydrogenated cotton seed oil', 'Progestins', 'Urea', 
        'Polyethylene Glycol', 'Formaldehyde', 'Butylated hydroxyanisole', 'butylated hydroxytoluene', 
        'Potassium bromate', 'Propyl gallate', 'Lead'
      ];

      const level2Ingredients = [
        'Salicylic acid', 'Botox', 'homosalate', 'octocrylene', 'octinoxate', 'Accutane', 
        'Benzoyl peroxide', 'Sodium Lauryl Sulphate', 'Triclosan', 'rosemary oil', 'Dihydroxyacetone', 
        'Phenoxyethanol', 'Cocamidopropyl betaine', 'Dimethicone', 'Homosalate', 'Homomenthyl salicylate', 
        '3,3,5-trimethyl-cyclohexyl-salicylate'
      ];

      const originalFetch = window.fetch;
      window.fetch = function() {
        const promise = originalFetch.apply(this, arguments);
        promise.then(res => {
          if (res.url.includes('/catalog/products/')) {
            res.clone().json().then(data => {
              data.regularChildSkus.forEach(sku => {
                const cleanIngredients = removeHtmlTags(sku.ingredientDesc);
                const level1Count = checkIngredients(cleanIngredients, level1Ingredients);
                const level2Count = checkIngredients(cleanIngredients, level2Ingredients);
                if (level1Count > 0 || level2Count > 0) {
                  const content = \`Product Name: \${data.productDetails.displayName}\nFound \${level1Count} Level 1 harmful ingredients (DO NOT USE) and \${level2Count} Level 2 harmful ingredients (consult with a doctor).\`;
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
              const level1Count = checkIngredients(cleanIngredients, level1Ingredients);
              const level2Count = checkIngredients(cleanIngredients, level2Ingredients);
              if (level1Count > 0 || level2Count > 0) {
                const content = \`Product Name: \${data.productDetails.displayName}\nFound \${level1Count} Level 1 harmful ingredients (DO NOT USE) and \${level2Count} Level 2 harmful ingredients (consult with a doctor).\`;
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
}

injectScript();
