console.log('Taro content script loaded successfully!');

// Function to patch both XMLHttpRequest and fetch
function injectScript() {
  document.addEventListener('DOMContentLoaded', function () {
    const script = document.createElement('script');
    script.textContent = `
      (() => {
        // Function to remove HTML tags from strings
        function removeHtmlTags(htmlString) {
          const noTags = htmlString.replace(/<\\/?[^>]+(>|$)/g, "");
          const cleanedString = noTags.replace(/\\s\\s+/g, ' ').trim();
          return cleanedString;
        }

        // Function to check and count harmful ingredients
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
                console.log('Fetch - Product Name:', data.productDetails.displayName);
                data.regularChildSkus.forEach(sku => {
                  const cleanIngredients = removeHtmlTags(sku.ingredientDesc);
                  const count = checkHarmfulIngredients(cleanIngredients);
                  console.log('Fetch - Ingredients:', cleanIngredients);
                  console.log('Number of harmful ingredients found:', count);
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
              try {
                const data = JSON.parse(this.responseText);
                console.log('XHR - Product Name:', data.productDetails.displayName);
                data.regularChildSkus.forEach(sku => {
                  const cleanIngredients = removeHtmlTags(sku.ingredientDesc);
                  const count = checkHarmfulIngredients(cleanIngredients);
                  console.log('XHR - Ingredients:', cleanIngredients);
                  console.log('Number of harmful ingredients found:', count);
                });
              } catch (err) {
                console.error('XHR parsing error:', err);
              }
            }
          });
          originalSend.apply(this, arguments);
        };
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  });
}

injectScript();
