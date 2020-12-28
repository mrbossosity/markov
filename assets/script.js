/* N.B. In nearly every instance, simple loops 
  have been given preference over higher-order 
  array methods to optimize performance time
  with large input strings. --mrbossosity */

  class StateInfo {
    constructor(memory, lastWord, numMatches) {
      this.memory = memory;
      this.lastWord = lastWord;
      this.matches = numMatches
    }
  }
  
  class MatrixRow {
    constructor(state, probsArr) {
      this.state = state;
      this.probs = probsArr
    }
  }
  
  function cleanText(str) {
    return str.toLowerCase()
      .replace(/\n|\r/g, " ")
      .replace(/\s\s+/g, " ")
      .replace(/[^\w\s]/g, "")
  }
  
  function iterateStates(words, order) {
    var states = [], x = 0;
    while (x < words.length - order) {
      let end = x + (order + 1);
      let wordGroup = words.slice(x, end);
      state = wordGroup.join(" ");
      states.push(state);
      x++
    }
    return states
  }
  
  function tallyStateMatches(states, inputWords) {
    var inputText = inputWords.join(" ");
    var tally = []; x = 0;
    while (x < states.length) {
      let state = states[x], stateWords = state.split(" ");
      let memory = stateWords.slice(0, (stateWords.length - 1)).join(" ");
      let lastWord = stateWords[stateWords.length - 1];
      let regex = new RegExp(`${state}`, "g");
      let matches = inputText.match(regex).length;
      tally.push(new StateInfo(memory, lastWord, matches));
      x++
    }
    return tally
  }
  
  function tallyMemories(stateTally) {
    var uniqueMemories = [];
    for (state of stateTally) {
      let memory = state.memory;
      uniqueMemories.push(memory)
    }
    return uniqueMemories
  }
  
  function transitionMatrix(uniqueMemory, stateTally) {
    console.time('matrix')
    var matrix = [];
    for (selectWords of uniqueMemory) {
      var statesWithSelect = [];
      for (stateInfo of stateTally) {
        if (stateInfo.memory == selectWords) statesWithSelect.push(stateInfo)
      }
  
      var totalChances = 0;
      for (state of statesWithSelect) {
        totalChances += state.matches
      }
  
      var probsArr = [];
      for (state of statesWithSelect) {
        let word = state.lastWord;
        let prob = Math.round((state.matches / totalChances) * 100);
        for (var x = 0; x < prob; x++) {
          probsArr.push(word)
        }
      }
  
      matrix.push(new MatrixRow(selectWords, probsArr))
    }
  
    console.timeEnd('matrix')
    return matrix
  }
  
  function generateString(matrix, order, numOfWords) {
    let initWords = matrix[Math.floor(Math.random () * matrix.length)].state.split(" ");
    let initState = initWords.join(" ");
    var arr = [...initWords];
    var row = matrix.find(row => row.state == initState);
    var nextWord = row.probs[Math.floor(Math.random() * row.probs.length)];
    arr.push(nextWord);
  
    var iterations = numOfWords - (order + 1);
    for (var x = 0; x < iterations; x++) {
      var lastState = arr.slice(arr.length - (order)).join(" ");
      row = matrix.find(row => row.state == lastState);
      if (row) {
        nextWord = row.probs[Math.floor(Math.random() * row.probs.length)];
        arr.push(nextWord)
      } else {
        arr.push("<br><span class='error-message'>(ERROR! Arrived at last state of input text and could not generate further. Hit 'New Strings' to get a fresh batch.)</span>")
        break
      }
    }
  
    return arr.join(" ")
  }
  
  function printStrings(order, num, words, transMatrix) {
    console.time('printStrings')
    var x = 0;
    while (x < num) {
      let str = generateString(transMatrix, order, words);
      $("#text").append(`${x + 1}. ${str}<br><br>`)
      x++
    }
    console.timeEnd('printStrings')
  }
  
  $("#markov-form").on("submit", () => {
    const markovOrder = Number($("#markovOrder").val());
    const cleanInput = cleanText($("#inputText").val());
    var inputWords = cleanInput.split(" ");
  
    for (var x = (inputWords.length - 1); x > -1; x--) {
      if (inputWords[x] == "") inputWords.splice(x, 1)
    }
  
    var [...uniqueStates] = new Set(iterateStates(inputWords, markovOrder));
    var stateTally = tallyStateMatches(uniqueStates, inputWords);
    var [...uniqueMemories] = new Set(tallyMemories(stateTally));
    var transMatrix = transitionMatrix(uniqueMemories, stateTally);
  
    var numStrings = $("#numStrings").val();
    var wordsPerString = $("#numWords").val();
  
    if ($("#goNew").is(":hidden")) {
      $("#goNew").show();
    } 
  
    $("#goNew").on("click", () => {
      $("#text").html("");
      numStrings = $("#numStrings").val();
      wordsPerString = $("#numWords").val();
      printStrings(markovOrder, numStrings, wordsPerString, transMatrix)
    })
  
    $("#text").html("");
    $("input").blur();
    printStrings(markovOrder, numStrings, wordsPerString, transMatrix)
  })