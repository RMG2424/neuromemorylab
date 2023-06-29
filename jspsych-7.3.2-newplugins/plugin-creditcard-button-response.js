var jsPsychCreditCardButtonResponse = (function (jspsych) {
    'use strict';

    const info = {
        name: "creditcard-button-response",
        parameters: {
            /** The HTML string to be displayed */
            stimulus: {
                type: jspsych.ParameterType.HTML_STRING,
                pretty_name: "Stimulus",
                default: undefined,
            },
            /** Array containing the label(s) for the button(s). */
            choices: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Choices",
                default: undefined,
                array: true,
            },
            /** The HTML for creating button. Can create own style. Use the "%choice%" string to indicate where the label from the choices parameter should be inserted. */
            button_html: {
                type: jspsych.ParameterType.HTML_STRING,
                pretty_name: "Button HTML",
                default: '<button class="jspsych-btn">%choice%</button>',
                array: true,
            },
            /** Any content here will be displayed under the button(s). */
            prompt: {
                type: jspsych.ParameterType.HTML_STRING,
                pretty_name: "Prompt",
                default: null,
            },
            /** How long to show the stimulus. */
            stimulus_duration: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Stimulus duration",
                default: null,
            },
            /** How long to show the trial. */
            trial_duration: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Trial duration",
                default: null,
            },
            /** The vertical margin of the button. */
            margin_vertical: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Margin vertical",
                default: "0px",
            },
            /** The horizontal margin of the button. */
            margin_horizontal: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Margin horizontal",
                default: "8px",
            },
            /** If true, then trial will end when user responds. */
            response_ends_trial: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Response ends trial",
                default: true,
            },
            canvas_horizontal: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Canvas width to test credit card dimensions",
                default: 600,
            },
            canvas_vertical: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Canvas height to test credit card dimensions",
                default: 300,
            },
            canvas_backcolor: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Canvas background color to test credit card dimensions",
                default: "lightgray",
            },
            canvas_strokeStyle: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Canvas line colors to test credit card dimensions",
                default: "black",
            }

        },
    };
    /**
    * creditcard-button-response
    * jsPsych plugin for displaying a stimulus, getting the credit card size, and getting a button response
    * @author Denis Cousineau
    */
    class CreditCardButtonResponsePlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }
        trial(display_element, trial) {
            // display stimulus
            var html = '<div id="jspsych-html-button-response-stimulus">' + 
                trial.stimulus + 
                "</div>";
            
            // display canvas area
            var ccwidth = trial.canvas_horizontal;
            var ccheight = trial.canvas_vertical;
            html += '<div id="jspsych-creditcard-button-response-stimulus">' + 
                '<canvas id="myCanvas" width="'+ccwidth+'" height="'+ccheight+'"></canvas>' +
            "</div>";

            //display buttons
            var buttons = [];
            if (Array.isArray(trial.button_html)) {
                if (trial.button_html.length == trial.choices.length) {
                    buttons = trial.button_html;
                } else {
                    console.error("Error in creditcard-button-response plugin. The length of the button_html array does not equal the length of the choices array");
                }
            } else {
                for (var i = 0; i < trial.choices.length; i++) {
                    buttons.push(trial.button_html);
                }
            }
            html += '<div id="jspsych-creditcard-button-response-btngroup">';
            for (var i = 0; i < trial.choices.length; i++) {
                var str = buttons[i].replace(/%choice%/g, trial.choices[i]);
                html += '<div class="jspsych-creditcard-button-response-button" style="display: inline-block; margin:' +
                    trial.margin_vertical +
                    " " +
                    trial.margin_horizontal +
                    '" id="jspsych-creditcard-button-response-button-' +
                    i +
                    '" data-choice="' +
                    i +
                    '">' +
                    str +
                    "</div>";
            }
            html += "</div>";
            //show prompt if there is one
            if (trial.prompt !== null) {
                html += trial.prompt;
            }
            display_element.innerHTML = html;

            /////////////////////////////////////////////////////////////////////////////////
            ////////// BEGIN CANVAS PART  ///////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////////

            // initialize event listener to canvas
            var canvas = document.getElementById('myCanvas');
            var ctx = canvas.getContext('2d'); 
            var rect = canvas.getBoundingClientRect();
            var offsetX = rect.left;
            var offsetY = rect.top;

            var isDown;                

            var posX = 20; 
            var posY = 20;
            const size = 20; const margin=1;
            var offX = size/2;
            var offY = size/2;

            function drawFixedLines(ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // draw fixed lines
                ctx.strokeStyle = trial.canvas_strokeStyle;
                ctx.fillStyle = trial.canvas_backcolor;
                ctx.fillRect(0, 0, ccwidth, ccheight);
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo( ccwidth-margin,  margin );
                ctx.lineTo( ccwidth-margin, ccheight-margin );
                ctx.stroke()    
                ctx.moveTo( ccwidth-margin, ccheight-margin );
                ctx.lineTo(  margin, ccheight-margin );
                ctx.stroke()
            }
            function drawRefLinesSquare(ctx, posX, posY) {
                ctx.lineWidth = 0.5;
                // draw moving rectangle
                ctx.beginPath();
                ctx.rect(posX-size/2, posY-size/2, size, size );
                ctx.stroke();
                // horizontal
                ctx.moveTo( posX + size/2, posY );
                ctx.lineTo( ccwidth-margin, posY );
                ctx.stroke();
                // vertical
                ctx.moveTo( posX, posY + size/2 );
                ctx.lineTo( posX, ccheight-margin );
                ctx.stroke();
            }
            drawFixedLines(ctx);
            drawRefLinesSquare(ctx, posX, posY );

            canvas.addEventListener("mousedown", (e) => handleMouseDown(e) );
            canvas.addEventListener("mousemove", (e) => handleMouseMove(e) );
            canvas.addEventListener("mouseup",   (e) => handleMouseUp(e)   );
            canvas.addEventListener("mouseout",  (e) => handleMouseOut(e)  );

            function handleMouseDown(e) {
                e.preventDefault();   
                e.stopPropagation();   

                rect = canvas.getBoundingClientRect();
                offsetX = rect.left;
                offsetY = rect.top;

                var mouseX = parseInt(e.clientX - offsetX);
                var mouseY = parseInt(e.clientY - offsetY);
                if ((mouseX <= posX+size/2)&&(mouseX >= posX-size/2)&&(mouseY <= posY+size/2)&&(mouseY >= posY-size/2)) {
                    isDown = true;
                    offX = mouseX - posX; 
                    offY = mouseY - posY; 
                }
            }

            function handleMouseMove(e) {
                e.preventDefault();   
                e.stopPropagation();
                if (!isDown) { return; }

                rect = canvas.getBoundingClientRect();
                offsetX = rect.left;
                offsetY = rect.top;

                posX = parseInt(e.clientX - offsetX) - offX;
                posY = parseInt(e.clientY - offsetY) - offY;

                drawFixedLines(ctx);
                drawRefLinesSquare(ctx, posX, posY );
            }


            function handleMouseUp(e) {
                e.preventDefault();   
                e.stopPropagation();
                if (!isDown) { return; }
                isDown = false;

                rect = canvas.getBoundingClientRect();
                offsetX = rect.left;
                offsetY = rect.top;

                posX= parseInt(e.clientX - offsetX)-offX;
                posY= parseInt(e.clientY - offsetY)-offY;
            }

            function handleMouseOut(e) {
                // just release the mouse down event.
                e.preventDefault();   
                e.stopPropagation();
                if(!isDown){return;}
                isDown = false;
            }

            /////////////////////////////////////////////////////////////////////////////////
            /////////// END CANVAS PART  ////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////////////////

            // start time
            var start_time = performance.now();
            // add event listeners to buttons
            for (var i = 0; i < trial.choices.length; i++) {
                display_element
                    .querySelector("#jspsych-creditcard-button-response-button-" + i)
                    .addEventListener("click", (e) => {
                    var btn_el = e.currentTarget;
                    var choice = btn_el.getAttribute("data-choice"); // don't use dataset for jsdom compatibility
                    after_response(choice);
                });
            }
            // store response
            var response = {
                rt: null,
                button: null,
            };
            // function to end trial when it is time
            const end_trial = () => {
                // kill any remaining setTimeout handlers
                this.jsPsych.pluginAPI.clearAllTimeouts();
                // gather the data to store for the trial
                var trial_data = {
                    rt: response.rt,
                    stimulus: trial.stimulus,
                    response: response.button,
                    //NEW
                    creditcardwidth:  ccwidth-posX,
                    creditcardheight: ccheight-posY
                };
                // clear the display
                display_element.innerHTML = "";
                // move on to the next trial
                this.jsPsych.finishTrial(trial_data);
            };
            // function to handle responses by the subject
            function after_response(choice) {
                // measure rt
                var end_time = performance.now();
                var rt = Math.round(end_time - start_time);
                response.button = parseInt(choice);
                response.rt = rt;
                // after a valid response, the stimulus will have the CSS class 'responded'
                // which can be used to provide visual feedback that a response was recorded
                display_element.querySelector("#jspsych-creditcard-button-response-stimulus").className += " responded";
                // disable all the buttons after a response
                var btns = document.querySelectorAll(".jspsych-creditcard-button-response-button button");
                for (var i = 0; i < btns.length; i++) {
                    //btns[i].removeEventListener('click');
                    btns[i].setAttribute("disabled", "disabled");
                }
                if (trial.response_ends_trial) {
                    end_trial();
                }
            }
            // hide image if timing is set
            if (trial.stimulus_duration !== null) {
                this.jsPsych.pluginAPI.setTimeout(() => {
                    display_element.querySelector("#jspsych-creditcard-button-response-stimulus").style.visibility = "hidden";
                }, trial.stimulus_duration);
            }
            // end trial if time limit is set
            if (trial.trial_duration !== null) {
                this.jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
            }
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
        create_simulation_data(trial, simulation_options) {
            const default_data = {
                stimulus: trial.stimulus,
                rt: this.jsPsych.randomization.sampleExGaussian(500, 50, 1 / 150, true),
                response: this.jsPsych.randomization.randomInt(0, trial.choices.length - 1),
                creditcardheight: 190, //totally arbitrary
                creditcardwidth:  300  //totally arbitrary
            };
            const data = this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);
            this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);
            return data;
        }
        simulate_data_only(trial, simulation_options) {
            const data = this.create_simulation_data(trial, simulation_options);
            this.jsPsych.finishTrial(data);
        }
        simulate_visual(trial, simulation_options, load_callback) {
            const data = this.create_simulation_data(trial, simulation_options);
            const display_element = this.jsPsych.getDisplayElement();
            this.trial(display_element, trial);
            load_callback();
            if (data.rt !== null) {
                this.jsPsych.pluginAPI.clickTarget(display_element.querySelector(`div[data-choice="${data.response}"] button`), data.rt);
            }
        }
    }
    CreditCardButtonResponsePlugin.info = info;

    return CreditCardButtonResponsePlugin;

})(jsPsychModule);
