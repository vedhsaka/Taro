console.log('Taro content script loaded successfully!');

// Function to create a popup with expandable content
function createPopup(content, hasHarmfulIngredients) {
    // Check if a popup already exists and remove it
    const existingPopup = document.getElementById('harmfulIngredientsPopup');
    if (existingPopup) {
      existingPopup.remove();
    }
  
    // Create a new popup that initially shows only the image
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
    popup.title = 'Click for details'; // Tooltip to indicate action
  
    // Expand function to show detailed content
    function expandPopup() {
      popup.style.width = '300px'; // Expanded width
      popup.style.height = '200px'; // Expanded height
      popup.style.borderRadius = '15px'; // Reset border radius for expanded view
      popup.innerHTML = `<h1>Harmful Ingredients Detected</h1><p>${content}</p>`; // Adding text
      popup.style.fontSize = '16px';
      popup.style.backgroundImage = ''; // Optionally remove the background image on expand
      popup.style.backgroundColor = 'white'; // Change background color for text visibility
      popup.style.flexDirection = 'column';
      popup.style.padding = '10px';
      popup.onclick = null; // Remove the click event listener after expansion
  
      // Add a close button to the expanded popup
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;'; // Stylish X as close button
      closeButton.style.position = 'absolute';
      closeButton.style.top = '5px';
      closeButton.style.right = '10px';
      closeButton.style.border = 'none';
      closeButton.style.background = 'none';
      closeButton.style.cursor = 'pointer';
      closeButton.style.fontSize = '24px';
      closeButton.style.color = 'black'; // Match the theme or change as needed
      closeButton.title = 'Close'; // Tooltip for close button
      closeButton.onclick = function() {
        popup.remove();
      };
  
      popup.appendChild(closeButton);
    }  
  
    // Event listener for expanding the popup
    popup.addEventListener('click', expandPopup);
  
    document.body.appendChild(popup);
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
            if (res.url.includes('/redsky_aggregations/v1/web/pdp_client_v1')) {
              res.clone().json().then(data => {
                let hasHarmfulIngredients = false;
                const productData = data.data.product;
                const ingredients = productData.item.enrichment.nutrition_facts.ingredients;
                if (ingredients) {
                  const cleanIngredients = removeHtmlTags(ingredients);
                  const count = checkHarmfulIngredients(cleanIngredients);
                  if (count > 0) {
                    hasHarmfulIngredients = true;
                    const content = 'Found ' + count + ' harmful ingredients in ' + productData.item.product_description.title;
                    const event = new CustomEvent('DetectedHarmfulIngredients', { detail: { content: content } });
                    document.dispatchEvent(event);
                  }
                }
                if (!hasHarmfulIngredients) {
                  const event = new CustomEvent('NoHarmfulIngredientsFound');
                  document.dispatchEvent(event);
                }
              }).catch(err => console.error('Fetch error:', err));
            }
          });
          return promise;
        };
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();
  });
}

injectScript();