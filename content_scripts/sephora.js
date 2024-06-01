console.log('Taro content script loaded successfully!');

// Function to handle the ingredients div
function handleIngredientsDiv() {
  console.log('handleIngredientsDiv function called');
  
  // Select the ingredients div using its selector
  const ingredientsDiv = document.querySelector("#ingredients > div > div");

  // Check if the ingredients div is found
  if (ingredientsDiv) {
    // Extract the text content of the div
    const ingredientsText = ingredientsDiv.innerText.trim(); // Trim to remove leading/trailing spaces
    console.log('Ingredients Text:', ingredientsText);
  } else {
    console.error('Ingredients div not found');
  }
}

// Wait for the page to be fully loaded
window.addEventListener('load', () => {
  // Call the function to handle the ingredients div
  handleIngredientsDiv();
});