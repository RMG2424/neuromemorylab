// Adaptation to the original code to avoid erasing the display
var jsPsychAudioKeyboardResponseNoErase = (function (jspsych) {
  'use strict';

  const info = {
      name: "audio-keyboard-response-noerase",
      parameters: {
          /** The audio file to be played. */
          stimulus: {
              type: jspsych.ParameterType.AUDIO,
              pretty_name: "Stimulus",
              default: undefined,
          },
          /** Array containing the key(s) the subject is allowed to press to respond to the stimulus. */
          choices: {
              type: jspsych.ParameterType.KEYS,
              pretty_name: "Choices",
              default: "ALL_KEYS",
          },
          /** Any content here will be displayed below the stimulus. */
          prompt: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "Prompt",
              default: null,
          },
          /** The maximum duration to wait for a response. */
          trial_duration: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Trial duration",
              default: null,
          },
          /** If true, the trial will end when user makes a response. */
          response_ends_trial: {
              type: jspsych.ParameterType.BOOL,
              pretty_name: "Response ends trial",
              default: true,
          },
          /** If true, then the trial will end as soon as the audio file finishes playing. */
          trial_ends_after_audio: {
              type: jspsych.ParameterType.BOOL,
              pretty_name: "Trial ends after audio",
              default: false,
          },
          /** If true, then responses are allowed while the audio is playing. If false, then the audio must finish playing before a response is accepted. */
          response_allowed_while_playing: {
              type: jspsych.ParameterType.BOOL,
              pretty_name: "Response allowed while playing",
              default: true,
          },
      },
  };
  /**
   * **audio-keyboard-response**
   *
   * jsPsych plugin for playing an audio file and getting a keyboard response
   *
   * @author Josh de Leeuw; adapted by Denis Cousineau (modifications 1 and 2 below) from
   * @see {@link https://www.jspsych.org/plugins/jspsych-audio-keyboard-response/ audio-keyboard-response plugin documentation on jspsych.org}
   */
  class AudioKeyboardResponsePlugin {
      constructor(jsPsych) {
          this.jsPsych = jsPsych;
      }
      trial(display_element, trial, on_load) {
          // hold the .resolve() function from the Promise that ends the trial
          let trial_complete;
          // setup stimulus
          var context = this.jsPsych.pluginAPI.audioContext();
          // store response
          var response = {
              rt: null,
              key: null,
          };
          // record webaudio context start time
          var startTime;
          // load audio file
          this.jsPsych.pluginAPI
              .getAudioBuffer(trial.stimulus)
              .then((buffer) => {
              if (context !== null) {
                  this.audio = context.createBufferSource();
                  this.audio.buffer = buffer;
                  this.audio.connect(context.destination);
              }
              else {
                  this.audio = buffer;
                  this.audio.currentTime = 0;
              }
              setupTrial();
          })
              .catch((err) => {
              console.error(`Failed to load audio file "${trial.stimulus}". Try checking the file path. We recommend using the preload plugin to load audio files.`);
              console.error(err);
          });
          const setupTrial = () => {
              // set up end event if trial needs it
              if (trial.trial_ends_after_audio) {
                  this.audio.addEventListener("ended", end_trial);
              }
              // show prompt if there is one
              if (trial.prompt !== null) {
                  display_element.innerHTML += trial.prompt;  // CHANGE #1: we add to the display, not replace it
              }
              // start audio
              if (context !== null) {
                  startTime = context.currentTime;
                  this.audio.start(startTime);
              }
              else {
                  this.audio.play();
              }
              // start keyboard listener when trial starts or sound ends
              if (trial.response_allowed_while_playing) {
                  setup_keyboard_listener();
              }
              else if (!trial.trial_ends_after_audio) {
                  this.audio.addEventListener("ended", setup_keyboard_listener);
              }
              // end trial if time limit is set
              if (trial.trial_duration !== null) {
                  this.jsPsych.pluginAPI.setTimeout(() => {
                      end_trial();
                  }, trial.trial_duration);
              }
              on_load();
          };
          // function to end trial when it is time
          const end_trial = () => {
              // kill any remaining setTimeout handlers
              this.jsPsych.pluginAPI.clearAllTimeouts();
              // stop the audio file if it is playing
              // remove end event listeners if they exist
              if (context !== null) {
                  this.audio.stop();
              }
              else {
                  this.audio.pause();
              }
              this.audio.removeEventListener("ended", end_trial);
              this.audio.removeEventListener("ended", setup_keyboard_listener);
              // kill keyboard listeners
              this.jsPsych.pluginAPI.cancelAllKeyboardResponses();
              // gather the data to store for the trial
              var trial_data = {
                  rt: response.rt,
                  stimulus: trial.stimulus,
                  response: response.key,
              };
              // clear the display
              //display_element.innerHTML = ""; // CHANGE #2: we do not erase the display
              // move on to the next trial
              this.jsPsych.finishTrial(trial_data);
              trial_complete();
          };
          // function to handle responses by the subject
          function after_response(info) {
              // only record the first response
              if (response.key == null) {
                  response = info;
              }
              if (trial.response_ends_trial) {
                  end_trial();
              }
          }
          const setup_keyboard_listener = () => {
              // start the response listener
              if (context !== null) {
                  this.jsPsych.pluginAPI.getKeyboardResponse({
                      callback_function: after_response,
                      valid_responses: trial.choices,
                      rt_method: "audio",
                      persist: false,
                      allow_held_key: false,
                      audio_context: context,
                      audio_context_start_time: startTime,
                  });
              }
              else {
                  this.jsPsych.pluginAPI.getKeyboardResponse({
                      callback_function: after_response,
                      valid_responses: trial.choices,
                      rt_method: "performance",
                      persist: false,
                      allow_held_key: false,
                  });
              }
          };
          return new Promise((resolve) => {
              trial_complete = resolve;
          });
      }
      simulate(trial, simulation_mode, simulation_options, load_callback) {
          if (simulation_mode == "data-only") {
              load_callback();
              this.simulate_data_only(trial, simulation_options);
          }
          if (simulation_mode == "visual") {
              this.simulate_visual(trial, simulation_options, load_callback);
          }
      }
      simulate_data_only(trial, simulation_options) {
          const data = this.create_simulation_data(trial, simulation_options);
          this.jsPsych.finishTrial(data);
      }
      simulate_visual(trial, simulation_options, load_callback) {
          const data = this.create_simulation_data(trial, simulation_options);
          const display_element = this.jsPsych.getDisplayElement();
          const respond = () => {
              if (data.rt !== null) {
                  this.jsPsych.pluginAPI.pressKey(data.response, data.rt);
              }
          };
          this.trial(display_element, trial, () => {
              load_callback();
              if (!trial.response_allowed_while_playing) {
                  this.audio.addEventListener("ended", respond);
              }
              else {
                  respond();
              }
          });
      }
      create_simulation_data(trial, simulation_options) {
          const default_data = {
              stimulus: trial.stimulus,
              rt: this.jsPsych.randomization.sampleExGaussian(500, 50, 1 / 150, true),
              response: this.jsPsych.pluginAPI.getValidKey(trial.choices),
          };
          const data = this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);
          this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);
          return data;
      }
  }
  AudioKeyboardResponsePlugin.info = info;

  return AudioKeyboardResponsePlugin;

})(jsPsychModule);
