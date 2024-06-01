// content_scripts/cvs.js
console.log('Taro content script loaded successfully for CVS!');

// Function to handle the ingredients div on CVS
function handleIngredientsDiv() {
    console.log('handleIngredientsDiv function called for CVS');
  
    // Select the button to expand the ingredients section
    const button = document.querySelector('#bottomDetails > div.accordionParent > div:nth-child(3) > div > button');
    console.log(button);
    if (button) {
      // Simulate a click on the button
      button.click();
  
      // Wait for a short delay to allow the ingredients div to become visible
      setTimeout(() => {
        // Select the ingredients div using its selector
        const ingredientsDiv = document.querySelector("#bottomDetails > div.accordionParent > div:nth-child(3) > div > div > span");
  
        // Check if the ingredients div is found
        if (ingredientsDiv) {
          // Extract the text content of the div
          const ingredientsText = ingredientsDiv.innerText.trim(); // Trim to remove leading/trailing spaces
          console.log('Ingredients Text on CVS:', ingredientsText);
        } else {
          console.error('Ingredients div not found on CVS');
        }
      }, 500); // Adjust the delay as needed
    } else {
      console.error('Button to expand ingredients section not found on CVS');
    }
  }
// Wait for the page to be fully loaded
window.addEventListener('load', () => {
  // Call the function to handle the ingredients div
  handleIngredientsDiv();
});