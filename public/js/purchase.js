//Event listeners
document.querySelector("#stockAmount").addEventListener("input", displayPriceMessage);

function displayPriceMessage(){
  let price = document.querySelector("#stockPrice").value;
  let amount = document.querySelector("#stockAmount").value;
  let total = (amount*price)+(amount*price*.5);
  total = total.toFixed(2);
  document.querySelector("#priceMessage").innerHTML=`<p>At $${price}/share, plus our small commission, brokerage fees and exchange rate adjustments (including federal, state and local taxes) it comes out to a mere $${total}! What a steal!</p><input type="hidden" name="loot" value="${total}">`;
}