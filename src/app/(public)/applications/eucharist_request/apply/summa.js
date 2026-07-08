const findLeastNumberOfCoins = (coins, amount) => {
  if(coins.length <= 0) {
    return -1;
  }
  for(let i=0; i<coins.length-1; i++) {
    for(let j=i+1; j<coins.length-2; j++) {
      if(coins[i] > coins[j]) {
        let temp = coins[i];
        coins[i] = coins[j];
        coins[j] = temp;
      }
    }
  }
  let numberOfMinCoinsNeeded = Math.round(amount / coins[coins.length-1]);
  if(numberOfMinCoinsNeeded * coins[coins.length-1] === amount) {
    return numberOfMinCoinsNeeded;
  } else {
    let neededAmount = amount - numberOfMinCoinsNeeded * coins[coins.length-1];
    for(let i=coins.length-2; i>=0; i--) {
      if(coins[i] === neededAmount) {
        return numberOfMinCoinsNeeded+1;
      }
    }
    
  }

  return -1;
}