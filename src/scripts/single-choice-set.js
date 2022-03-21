import SingleChoice from './single-choice';
import SolutionView from './solution-view';
import ResultSlide from './result-slide';
import SoundEffects from './sound-effects';
import XApiEventBuilder from './xapi-event-builder';
import StopWatch from './stop-watch';
import VerovioScoreEditor from 'verovioscoreeditor';

import {
    jQuery as $, JoubelUI as UI, Question
}
from "./globals";

const Score4LMS = (function () {
    /**
     * @constructor
     * @extends Question
     * @param {object} options Options for single choice set
     * @param {string} contentId H5P instance id
     * @param {Object} contentData H5P instance data
     */
    function Score4LMS(options, contentId, contentData) {
        var self = this;
        
        // Extend defaults with provided options
        this.contentId = contentId;
        Question.call(this, 'single-choice-set');
        this.options = $.extend(true, {
        }, {
            choices:[],
            overallFeedback:[],
            behaviour: {
                timeoutCorrect: 2000,
                timeoutWrong: 3000,
                soundEffectsEnabled: true,
                enableRetry: true,
                enableSolutionsButton: true,
                autoCheck: true,
                passPercentage: 100
            }
        },
        options);
        if (contentData && contentData.previousState !== undefined) {
            this.currentIndex = contentData.previousState.progress;
            this.results = contentData.previousState.answers;
        }
        this.currentIndex = this.currentIndex || 0;
        this.results = this.results || {
            corrects: 0,
            wrongs: 0
        };
        
        /**
         * @property {StopWatch[]} Stop watches for tracking duration of slides
         */
        this.stopWatches =[];
        this.startStopWatch(this.currentIndex);
        
        /**
         * The users input on the questions. Uses the same index as this.options.choices
         * @type {number[]}
         */
        this.userResponses =[];
        
        this.muted = (this.options.behaviour.soundEffectsEnabled === false);
        
        this.l10n = H5P.jQuery.extend({
            correctText: 'Correct!',
            incorrectText: 'Incorrect! Correct answer was: :text',
            showSolutionButtonLabel: 'Show solution',
            retryButtonLabel: 'Retry',
            closeButtonLabel: 'Close',
            solutionViewTitle: 'Solution',
            slideOfTotal: 'Slide :num of :total',
            muteButtonLabel: "Mute feedback sound",
            scoreBarLabel: 'You got :num out of :total points',
        },
        options.l10n !== undefined ? options.l10n: {
        });
        
        this.$container = $('<div>', {
            'class': 'h5p-sc-set-wrapper'
        });
        console.log("test****************");
        console.log(options);
        if (options.behaviour.autoCheck) {
            this.$container.addClass('h5p-auto-check');
        }
        
        this.$slides =[];
        // An array containing the SingleChoice instances
        this.choices =[];
        
        /**
         * The solution dialog
         * @type {SolutionView}
         */
        this.solutionView = new SolutionView(contentId, this.options.choices, this.l10n);
        
        // Focus on first button when closing solution view
        this.solutionView.on('hide', function () {
            self.focusButton();
        });
        
        this.$choices = $('<div>', {
            'class': 'h5p-sc-set h5p-sc-animate'
        });
        
        // sometimes an empty object is in the choices
        this.options.choices = this.options.choices.filter(function (choice) {
            return choice !== undefined && ! ! choice.answers;
        });
        
        var numQuestions = this.options.choices.length;
        
        // Create progressbar
        self.progressbar = UI.createProgressbar(numQuestions + 1, {
            progressText: this.l10n.slideOfTotal
        });
        self.progressbar.setProgress(this.currentIndex);
        
        
        console.log("choicesVOR****************");
          // .getElementById("mpw84lc")..querySelector("#rootSVG")
        console.log(this.options);
             
        for (var i = 0; i < this.options.descriptions.length; i++) {
        
         console.log("in this.options.descriptions");
         console.log(i);
         
            var choice = new SingleChoice(this.options.descriptions[i], i, this.contentId, self.options.behaviour.autoCheck, 'descContent');
            //choice.on('finished', this.handleQuestionFinished, this);
            //choice.on('alternative-selected', this.handleAlternativeSelected, this);
            
            choice.appendTo(this.$choices, (i === this.currentIndex));
            this.choices.push(choice);
            this.$slides.push(choice.$choice);
            
            var indexDesc = this.options.descriptions[i];
            var vse = new VerovioScoreEditor(this.$choices, {data: indexDesc.Notation});
            console.log(vse);
            
            
          
        }
        
        
       //console.log(H5PEditor.widgets.notationWidget);
       console.log(document);
          
        for (var i = 0; i < this.options.choices.length; i++) {
        console.log("in this.options.choices");
        console.log(i);
            var choice = new SingleChoice(this.options.choices[i], i, this.contentId, self.options.behaviour.autoCheck);
            choice.on('finished', this.handleQuestionFinished, this);
            choice.on('alternative-selected', this.handleAlternativeSelected, this);
            choice.appendTo(this.$choices, (i === this.currentIndex));
            this.choices.push(choice);
            this.$slides.push(choice.$choice);
           
        }
        
        this.resultSlide = new ResultSlide(this.options.choices.length);
        this.resultSlide.appendTo(this.$choices);
       
        this.resultSlide.on('retry', this.resetTask, this);
        this.resultSlide.on('view-solution', this.handleViewSolution, this);
        this.$slides.push(this.resultSlide.$resultSlide);
        this.on('resize', this.resize, this);
        
         console.log("$choices****************");
        console.log(this.$choices);
        
       
            
        
        // Use the correct starting slide
        this.recklessJump(this.currentIndex);
        
        if (this.options.choices.length === this.currentIndex) {
            // Make sure results slide is displayed
            this.resultSlide.$resultSlide.addClass('h5p-sc-current-slide');
            this.setScore(this.results.corrects, true, 0);
        }
        
        if (! this.muted) {
            setTimeout(function () {
                SoundEffects.setup(self.getLibraryFilePath(''));
            },
            1);
        }
        
        /**
         * Keeps track of buttons that will be hidden
         * @type {Array}
         */
        self.buttonsToBeHidden =[];
        
        /**
         * Override Question's hideButton function
         * to be able to hide buttons after delay
         *
         * @override
         * @param {string} id
         */
        this.superHideButton = self.hideButton;
        this.hideButton = (function () {
            return function (id) {
                
                if (! self.scoreTimeout) {
                    return self.superHideButton(id);
                }
                
                self.buttonsToBeHidden.push(id);
                return this;
            };
        })();
    }
    
    Score4LMS.prototype = Object.create(Question.prototype);
    console.log("*****************************************");
     console.log(Score4LMS.prototype);
   
    Score4LMS.prototype. constructor = Score4LMS;
    
    /**
     * Set if a element is tabbable or not
     *
     * @param {jQuery} $element The element
     * @param {boolean} tabbable If element should be tabbable
     * @returns {jQuery} The element
     */
    Score4LMS.prototype.setTabbable = function ($element, tabbable) {
        $element.attr('tabindex', tabbable ? 0: -1);
        return $element;
    };
    
    /**
     * Handle alternative selected, i.e play sound if sound effects are enabled
     *
     * @method handleAlternativeSelected
     * @param  {Object} event Event that was fired
     */
    Score4LMS.prototype.handleAlternativeSelected = function (event) {
        var self = this;
        var isCorrect = event.data.correct;
        
        if (isCorrect) {
            self.results.corrects++;
        } else {
            self.results.wrongs++;
        }
        
        self.triggerXAPI('interacted');
        
        // correct answer
        var correctAnswer = self.$choices.find('.h5p-sc-is-correct').text();
        
        // Announce by ARIA if answer is correct or incorrect
        var text = isCorrect ? self.l10n.correctText: (self.l10n.incorrectText.replace(':text', correctAnswer));
        self.read(text);
        
        if (! this.muted) {
            // Can't play it after the transition end is received, since this is not
            // accepted on iPad. Therefore we are playing it here with a delay instead
            SoundEffects.play(isCorrect ? 'positive-short': 'negative-short', 700);
        }
    };
    
    /**
     * Handler invoked when question is done
     *
     * @param  {object} event An object containing a single boolean property: "correct".
     */
    Score4LMS.prototype.handleQuestionFinished = function (event) {
        var self = this;
        
        var index = event.data.index;
        
        // saves user response
        var userResponse = self.userResponses[index] = event.data.answerIndex;
        
        // trigger answered event
        var duration = this.stopStopWatch(index);
        var xapiEvent = self.createXApiAnsweredEvent(self.options.choices[index], userResponse, duration);
        
        self.trigger(xapiEvent);
        
        // if should show result slide
        if (self.currentIndex + 1 >= self.options.choices.length) {
            self.setScore(self.results.corrects);
        }
        
        var letsMove = function () {
            // Handle impatient users
            self.$container.off('click.impatient keydown.impatient');
            clearTimeout(timeout);
            self.move(self.currentIndex + 1);
        };
        
        var timeout = setTimeout(function () {
            letsMove();
        },
        event.data.correct ? self.options.behaviour.timeoutCorrect: self.options.behaviour.timeoutWrong);
        
        self.$container.on('click.impatient', function () {
            letsMove();
        });
        
        self.$container.on('keydown.impatient', function (event) {
            // If return, space or right arrow
            if (event.which === 13 || event.which === 32 || event.which === 39) {
                letsMove();
            }
        });
    };
    
    /**
     * Creates an xAPI answered event
     *
     * @param {object} question
     * @param {number} userAnswer
     * @param {number} duration
     *
     * @return {H5P.XAPIEvent}
     */
    Score4LMS.prototype.createXApiAnsweredEvent = function (question, userAnswer, duration) {
        var self = this;
        var types = XApiEventBuilder.interactionTypes;
        
        // creates the definition object
        var definition = XApiEventBuilder.createDefinition().interactionType(types.CHOICE).description(question.question).correctResponsesPattern(self.getXApiCorrectResponsePattern()).optional(self.getXApiChoices(question.answers)).build();
        
        // create the result object
        var result = XApiEventBuilder.createResult().response(userAnswer.toString()).duration(duration).score((userAnswer === 0) ? 1: 0, 1).completion(true).success(userAnswer === 0).build();
        
        return XApiEventBuilder.create().verb(XApiEventBuilder.verbs.ANSWERED).objectDefinition(definition).context(self.contentId, self.subContentId).contentId(self.contentId, question.subContentId).result(result).build();
    };
    
    /**
     * Returns the 'correct response pattern' for xApi
     *
     * @return {string[]}
     */
    Score4LMS.prototype.getXApiCorrectResponsePattern = function () {
        return[XApiEventBuilder.createCorrectResponsePattern([(0).toString()])]; // is always '0' for SCS
    };
    
    /**
     * Returns the choices array for xApi statements
     *
     * @param {String[]} answers
     *
     * @return {{ choices: []}}
     */
    Score4LMS.prototype.getXApiChoices = function (answers) {
        var choices = answers.map(function (answer, index) {
            return XApiEventBuilder.createChoice(index.toString(), answer);
        });
        
        return {
            choices: choices
        };
    };
    
    /**
     * Handles buttons that are queued for hiding
     */
    Score4LMS.prototype.handleQueuedButtonChanges = function () {
        var self = this;
        
        if (self.buttonsToBeHidden.length) {
            self.buttonsToBeHidden.forEach(function (id) {
                self.superHideButton(id);
            });
        }
        self.buttonsToBeHidden =[];
    };
    
    /**
     * Set score and feedback
     *
     * @params {Number} score Number of correct answers
     */
    Score4LMS.prototype.setScore = function (score, noXAPI, timeout) {
        var self = this;
        
        // Find last selected alternative, and determine timeout before solution slide shows
        if (! self.choices.length) {
            return;
        }
        var lastSelected = self.choices[self.choices.length - 1].$choice.find('.h5p-sc-alternative.h5p-sc-selected');
        
        timeout = (timeout !== undefined) ? timeout: (lastSelected.is('.h5p-sc-is-correct') ?
        this.options.behaviour.timeoutCorrect:
        this.options.behaviour.timeoutWrong);
        
        /**
         * Show feedback and buttons on result slide
         */
        var showFeedback = function () {
            self.setFeedback(determineOverallFeedback(self.options.overallFeedback, score / self.options.choices.length).replace(':numcorrect', score).replace(':maxscore', self.options.choices.length.toString()),
            score, self.options.choices.length, self.l10n.scoreBarLabel);
            
            if (score === self.options.choices.length) {
                self.hideButton('try-again');
                self.hideButton('show-solution');
            } else {
                self.showButton('try-again');
                self.showButton('show-solution');
            }
            self.handleQueuedButtonChanges();
            self.scoreTimeout = undefined;
            
            if (! noXAPI) {
                self.triggerXAPIScored(score, self.options.choices.length, 'completed', true, (100 * score / self.options.choices.length) >= self.options.behaviour.passPercentage);
            }
            
            self.trigger('resize');
        };
        
        /**
         * Wait for result slide animation
         */
        self.scoreTimeout = setTimeout(function () {
            showFeedback();
        },
        (timeout));
        
        // listen for impatient keyboard clicks
        self.$container.one('keydown.impatient', function (event) {
            // If return, space or right arrow
            if (event.which === 13 || event.which === 32 || event.which === 39) {
                clearTimeout(self.scoreTimeout);
                showFeedback();
            }
        });
        
        /**
         * Listen for impatient clicks.
         * On impatient clicks clear timeout and immediately show feedback.
         */
        self.$container.one('click.impatient', function () {
            clearTimeout(self.scoreTimeout);
            showFeedback();
        });
    };
    
    /**
     * Handler invoked when view solution is selected
     */
    Score4LMS.prototype.handleViewSolution = function () {
        var self = this;
        
        var $tryAgainButton = $('.h5p-question-try-again', self.$container);
        var $showSolutionButton = $('.h5p-question-show-solution', self.$container);
        var buttons =[self.$muteButton, $tryAgainButton, $showSolutionButton];
        
        // remove tabbable for buttons in result view
        buttons.forEach(function (button) {
            self.setTabbable(button, false);
        });
        
        self.solutionView.on('hide', function () {
            // re-add tabbable for buttons in result view
            buttons.forEach(function (button) {
                self.setTabbable(button, true);
            });
            self.toggleAriaVisibility(true);
        });
        
        self.solutionView.show();
        self.toggleAriaVisibility(false);
    };
    
    /**
     * Toggle elements visibility to Assistive Technologies
     *
     * @param {boolean} enable Make elements visible
     */
    Score4LMS.prototype.toggleAriaVisibility = function (enable) {
        var self = this;
        var ariaHidden = enable ? '': 'true';
        self.$muteButton.attr('aria-hidden', ariaHidden);
        self.progressbar.$progressbar.attr('aria-hidden', ariaHidden);
        self.$choices.attr('aria-hidden', ariaHidden);
    };
    
    /**
     * Register DOM elements before they are attached.
     * Called from H5P.Question.
     */
    Score4LMS.prototype.registerDomElements = function () {
        // Register task content area.
        this.setContent(this.createQuestion());
        
        // Register buttons with question.
        this.addButtons();
        
        // Insert feedback and buttons section on the result slide
        this.insertSectionAtElement('feedback', this.resultSlide.$feedbackContainer);
        this.insertSectionAtElement('buttons', this.resultSlide.$buttonContainer);
        
        // Question is finished
        if (this.options.choices.length === this.currentIndex) {
            this.trigger('question-finished');
        }
    };
    
    /**
     * Add Buttons to question.
     */
    Score4LMS.prototype.addButtons = function () {
        var self = this;
        
        if (this.options.behaviour.enableRetry) {
            this.addButton('try-again', this.l10n.retryButtonLabel, function () {
                self.resetTask();
            },
            self.results.corrects !== self.options.choices.length);
        }
        
        if (this.options.behaviour.enableSolutionsButton) {
            this.addButton('show-solution', this.l10n.showSolutionButtonLabel, function () {
                self.showSolutions();
            },
            self.results.corrects !== self.options.choices.length);
        }
    };
    
    /**
     * Create main content
     */
    Score4LMS.prototype.createQuestion = function () {
        var self = this;
        
        self.progressbar.appendTo(self.$container);
        self.$container.append(self.$choices);
        
        function toggleMute(event) {
            var $button = $(event.target);
            event.preventDefault();
            self.muted = ! self.muted;
            $button.attr('aria-pressed', self.muted);
        }
        
        if (self.options.behaviour.soundEffectsEnabled) {
            self.$muteButton = $('<div>', {
                'class': 'h5p-sc-sound-control',
                'tabindex': 0,
                'role': 'button',
                'aria-label': self.l10n.muteButtonLabel,
                'aria-pressed': false,
                'on': {
                    'keydown': function (event) {
                        switch (event.which) {
                            case 13: // Enter
                            case 32: // Space
                            toggleMute(event);
                            break;
                        }
                    }
                },
                'click': toggleMute
            });
            
            self.$container.append(self.$muteButton);
        }
        
        // Append solution view - hidden by default:
        self.solutionView.appendTo(self.$container);
        
        self.resize();
        
        // Hide all other slides than the current one:
        self.$container.addClass('initialized');
        
        console.log("createQuestion+++++++++++++");
        console.log(self);
        console.log(self.$container);
        
        return self.$container;
    };
    
    /**
     * Resize if something outside resizes
     */
    Score4LMS.prototype.resize = function () {
        var self = this;
        var maxHeight = 0;
        self.choices.forEach(function (choice) {
            var choiceHeight = choice.$choice.outerHeight();
            maxHeight = choiceHeight > maxHeight ? choiceHeight: maxHeight;
        });
        
        // Set minimum height for choices
        self.$choices.css({
            minHeight: maxHeight + 'px'
        });
    };
    
    /**
     * Will jump to the given slide without any though to animations,
     * current slide etc.
     *
     * @public
     */
    Score4LMS.prototype.recklessJump = function (index) {
        var tX = 'translateX(' + (- index * 100) + '%)';
        this.$choices.css({
            '-webkit-transform': tX,
            '-moz-transform': tX,
            '-ms-transform': tX,
            'transform': tX
        });
        this.progressbar.setProgress(index + 1);
    };
    
    /**
     * Move to slide n
     * @param  {number} index The slide number    to move to
     */
    Score4LMS.prototype.move = function (index) {
        var self = this;
        if (index === this.currentIndex) {
            return;
        }
        
        var $previousSlide = self.$slides[self.currentIndex];
        var currentChoice = self.choices[index];
        var $currentSlide = self.$slides[index];
        
        H5P.Transition.onTransitionEnd(self.$choices, function () {
            $previousSlide.removeClass('h5p-sc-current-slide');
            
            // on slides with answers focus on first alternative
            if (index < self.choices.length) {
                currentChoice.focusOnAlternative(0);
            }
            // on last slide, focus on try again button
            else {
                self.resultSlide.focusScore();
            }
        },
        600);
        
        // start timing of new slide
        this.startStopWatch(index);
        
        // move to slide
        $currentSlide.addClass('h5p-sc-current-slide');
        self.recklessJump(index);
        
        self.currentIndex = index;
    };
    
    /**
     * Starts a stopwatch for indexed slide
     *
     * @param {number} index
     */
    Score4LMS.prototype.startStopWatch = function (index) {
        this.stopWatches[index] = this.stopWatches[index] || new StopWatch();
        this.stopWatches[index].start();
    };
    
    /**
     * Stops a stopwatch for indexed slide
     *
     * @param {number} index
     */
    Score4LMS.prototype.stopStopWatch = function (index) {
        if (this.stopWatches[index]) {
            this.stopWatches[index].stop();
        }
    };
    
    /**
     * Returns the passed time in seconds of a stopwatch on an indexed slide,
     * or 0 if not existing
     *
     * @param {number} index
     * @return {number}
     */
    Score4LMS.prototype.timePassedInStopWatch = function (index) {
        if (this.stopWatches[index] !== undefined) {
            return this.stopWatches[index].passedTime();
        } else {
            // if not created, return no passed time,
            return 0;
        }
    };
    
    /**
     * Returns the time the user has spent on all questions so far
     *
     * @return {number}
     */
    Score4LMS.prototype.getTotalPassedTime = function () {
        return this.stopWatches.filter(function (watch) {
            return watch != undefined;
        }).reduce(function (sum, watch) {
            return sum + watch.passedTime();
        },
        0);
    };
    
    /**
     * The following functions implements the CP and IV - Contracts v 1.0 documented here:
     * http://h5p.org/node/1009
     */
    Score4LMS.prototype.getScore = function () {
        return this.results.corrects;
    };
    
    Score4LMS.prototype.getMaxScore = function () {
        return this.options.choices.length;
    };
    
    Score4LMS.prototype.getAnswerGiven = function () {
        return (this.results.corrects + this.results.wrongs) > 0;
    };
    
    Score4LMS.prototype.getTitle = function () {
        return (this.options.choices[0] ? H5P.createTitle(this.options.choices[0].question): '');
    };
    
    /**
     * Retrieves the xAPI data necessary for generating result reports.
     *
     * @return {object}
     */
    Score4LMS.prototype.getXAPIData = function () {
        var self = this;
        
        // create array with userAnswer
        var children = self.options.choices.map(function (question, index) {
            var userResponse = self.userResponses[index] >= 0 ? self.userResponses[index]: '';
            var duration = self.timePassedInStopWatch(index);
            var event = self.createXApiAnsweredEvent(question, userResponse, duration);
            
            return {
                statement: event.data.statement
            };
        });
        
        var result = XApiEventBuilder.createResult().score(self.getScore(), self.getMaxScore()).duration(self.getTotalPassedTime()).build();
        
        // creates the definition object
        var definition = XApiEventBuilder.createDefinition().interactionType(XApiEventBuilder.interactionTypes.COMPOUND).build();
        
        var xAPIEvent = XApiEventBuilder.create().verb(XApiEventBuilder.verbs.ANSWERED).contentId(self.contentId, self.subContentId).context(self.getParentAttribute('contentId'), self.getParentAttribute('subContentId')).objectDefinition(definition).result(result).build();
        
        return {
            statement: xAPIEvent.data.statement,
            children: children
        };
    };
    
    /**
     * Returns an attribute from this.parent if it exists
     *
     * @param {string} attributeName
     * @return {*|undefined}
     */
    Score4LMS.prototype.getParentAttribute = function (attributeName) {
        var self = this;
        
        if (self.parent !== undefined) {
            return self.parent[attributeName];
        }
    };
    
    Score4LMS.prototype.showSolutions = function () {
        this.handleViewSolution();
    };
    
    /**
     * Reset all answers. This is equal to refreshing the quiz
     */
    Score4LMS.prototype.resetTask = function () {
        var self = this;
        
        // Close solution view if visible:
        this.solutionView.hide();
        
        // Reset the user's answers
        var classes =[ 'h5p-sc-reveal-wrong', 'h5p-sc-reveal-correct', 'h5p-sc-selected', 'h5p-sc-drummed', 'h5p-sc-correct-answer'];
        for (var i = 0; i < classes.length; i++) {
            this.$choices.find('.' + classes[i]).removeClass(classes[i]);
        }
        this.results = {
            corrects: 0,
            wrongs: 0
        };
        
        this.choices.forEach(function (choice) {
            choice.setAnswered(false);
        });
        
        this.stopWatches.forEach(function (stopWatch) {
            if (stopWatch) {
                stopWatch.reset();
            }
        });
        
        this.move(0);
        
        // Wait for transition, then remove feedback.
        H5P.Transition.onTransitionEnd(this.$choices, function () {
            self.removeFeedback();
        },
        600);
    };
    
    /**
     * Clever comment.
     *
     * @public
     * @returns {object}
     */
    Score4LMS.prototype.getCurrentState = function () {
        return {
            progress: this.currentIndex,
            answers: this.results
        };
    };
    
    /**
     * Determine the overall feedback to display for the question.
     * Returns empty string if no matching range is found.
     *
     * @param {Object[]} feedbacks
     * @param {number} scoreRatio
     * @return {string}
     */
    var determineOverallFeedback = function (feedbacks, scoreRatio) {
        scoreRatio = Math.floor(scoreRatio * 100);
        
        for (var i = 0; i < feedbacks.length; i++) {
            var feedback = feedbacks[i];
            var hasFeedback = (feedback.feedback !== undefined && feedback.feedback.trim().length !== 0);
            
            if (feedback. from <= scoreRatio && feedback.to >= scoreRatio && hasFeedback) {
                return feedback.feedback;
            }
        }
        
        return '';
    };
    
    return Score4LMS;
})();

export default Score4LMS;