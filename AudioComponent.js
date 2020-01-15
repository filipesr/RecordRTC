var isEdge =
  navigator.userAgent.indexOf("Edge") !== -1 &&
  (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob);
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

var recorder; // globally accessible
var microphone;

function captureMicrophone(callback) {
  if (microphone) {
    callback(microphone);
    return;
  }

  if (
    typeof navigator.mediaDevices === "undefined" ||
    !navigator.mediaDevices.getUserMedia
  ) {
    alert("This browser does not supports WebRTC getUserMedia API.");

    if (!!navigator.getUserMedia)
      alert("This browser seems supporting deprecated getUserMedia API.");
  }

  navigator.mediaDevices
    .getUserMedia({ audio: isEdge ? true : { echoCancellation: false } })
    .then(function(mic) {
      callback(mic);
    })
    .catch(function(error) {
      alert("Unable to capture your microphone. Please check console logs.");
      console.error(error);
    });
}

function replaceAudio(divInput, src) {
  var newAudio = document.createElement("audio");
  newAudio.className = "gravacao";
  newAudio.controls = true;
  newAudio.autoplay = true;

  if (src) newAudio.src = src;

  var parentNode = divInput;
  parentNode.innerHTML = "";
  parentNode.appendChild(newAudio);
}

function btnStartRecordClick(btnStartRecord, btnStopRecord, divInput) {
  if (!microphone) {
    captureMicrophone(function(mic) {
      microphone = mic;

      if (isSafari) {
        replaceAudio(divInput);
        var audio = divInput.querySelector("audio.gravacao");

        audio.muted = true;
        audio.srcObject = microphone;

        btnStartRecord.style.display = "";
        btnStartRecord.style.border = "1px solid red";
        btnStartRecord.style.fontSize = "150%";

        alert("Please click startRecording button again. First time we tried to access your microphone. Now we will record it.");
        return;
      }

      click(btnStartRecord);
    });
    return;
  }

  document.querySelectorAll(".btn-start-recording").forEach(function(el) {
    el.style.display = "none";
  });
  replaceAudio(divInput);
  var audio = divInput.querySelector("audio.gravacao");

  audio.muted = true;
  audio.srcObject = microphone;

  var options = {
    type: "audio",
    numberOfAudioChannels: isEdge ? 1 : 2,
    checkForInactiveTracks: true,
    bufferSize: 16384
  };

  if (isSafari || isEdge) options.recorderType = StereoAudioRecorder;

  if (navigator.platform && navigator.platform
      .toString()
      .toLowerCase()
      .indexOf("win") === -1
  )
    options.sampleRate = 16000;

  if (isSafari) {
    options.sampleRate = 16000;
    options.bufferSize = 4096;
    options.numberOfAudioChannels = 2;
  }

  if (recorder) {
    recorder.destroy();
    recorder = null;
  }

  recorder = RecordRTC(microphone, options);

  recorder.startRecording();

  btnStopRecord.style.display = "";
}

function stopRecordingCallback(btnStartRecord, divInput) {
  replaceAudio(divInput, recorder.getBlob() ? URL.createObjectURL(recorder.getBlob()) : null
  );

  document.querySelectorAll(".btn-start-recording").forEach(function(el) {
    el.style.display = "";
  })
}

function btnStopRecordClick(btnStopRecord, btnStartRecord, divInput) {
  btnStopRecord.style.display = "none";
  if (recorder) recorder.stopRecording(() => stopRecordingCallback(btnStartRecord, divInput));
}

function click(el) {
  el.style.display = ""; // make sure that element is not disabled
  var evt = document.createEvent("Event");
  evt.initEvent("click", true, true);
  el.dispatchEvent(evt);
}

/* Cria o componente de gravação
 * divParent é a div onde será criado o componente
 * divId é o nome da div pai do componente, para usos de scripts posteriores, caso precise
 * title é o texto de informação
 * callback é a função 
 */
function createComponentOn(divParent, divId, title) {
  //Seleciona a div de conteúdo
  var divParent = document.getElementById(divParent);
  //Cria a div pai
  var divComponent = document.createElement("div");
  divComponent.className = "componente-audio";
  divComponent.id = divId;

  //Cria a div onde se encontra o input de texto
  var divInput = document.createElement("div");
  divInput.className = "divInput";
  //Cria o input de texto
  var inputText = document.createElement("input");
  inputText.className = "texto";
  //Adiciona os elementos criados ao componente
  divInput.appendChild(inputText);
  divComponent.appendChild(divInput);

  //Adiciona o Label
  if(title) {
    var labTitle = document.createElement("label");
    labTitle.appendChild(document.createTextNode(title));
    labTitle.className = "label-audio";
    divComponent.appendChild(labTitle);
  }

  //Cria o botão de início da gravação e atribui as classes
  var btnStartRecord = document.createElement("button");
  btnStartRecord.className = "btn-start-recording";
  btnStartRecord.appendChild(document.createTextNode("🎤"));

  //Cria o botão de fim da gravação e atribui as classes
  var btnStopRecord = document.createElement("button");
  btnStopRecord.className = "btn-stop-recording";
  btnStopRecord.style.display = "none";
  btnStopRecord.appendChild(document.createTextNode("🛑"));

  //Cria os eventos e adiciona os botões ao componente
  btnStartRecord.addEventListener("click", () => btnStartRecordClick(btnStartRecord, btnStopRecord, divInput) );
  divComponent.appendChild(btnStartRecord);
  btnStopRecord.addEventListener("click", () => btnStopRecordClick(btnStopRecord, btnStartRecord, divInput) );
  divComponent.appendChild(btnStopRecord);

  divParent.appendChild(divComponent);
}