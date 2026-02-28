/**
 * RepTracker - Reusable state management component for exercise repetition tracking
 * Encapsulates EMA smoothing, cooldown timers, baseline recalibration, and state transitions
 */
class RepTracker {
  /**
   * Create a new RepTracker instance
   * @param {Object} config - Configuration object
   * @param {number} config.minRepMs - Minimum time between reps (milliseconds)
   * @param {number} config.emaAlpha - EMA smoothing factor (0-1)
   * @param {number} config.cooldownMs - Cooldown after rep counted (milliseconds)
   * @param {Object} config.stateTransitions - Valid state transition map
   * @param {boolean} config.debugMode - Enable detailed logging
   */
  constructor(config = {}) {
    this.minRepMs = config.minRepMs || 400;
    this.emaAlpha = config.emaAlpha || 0.3;
    this.cooldownMs = config.cooldownMs || 200;
    this.stateTransitions = config.stateTransitions || {
      'up': ['down'],
      'down': ['up']
    };
    this.debugMode = config.debugMode || false;

    // Internal state
    this.currentState = 'up';
    this.lastTransitionTime = 0;
    this.lastRepTime = 0;
    this.smoothedValues = {};
    this.inCooldown = false;

    if (this.debugMode) {
      console.log('RepTracker initialized with config:', config);
    }
  }

  /**
   * Update tracker with new frame metrics
   * @param {Object} metrics - Frame-specific measurements
   * @param {string} metrics.currentState - Detected state ('up', 'down', etc.)
   * @param {number} metrics.timestamp - Frame timestamp in ms
   * @param {Object} metrics.angles - Computed joint angles
   * @returns {Object} - { stateChanged, shouldCount, feedback }
   */
  updateState(metrics) {
    const { currentState, timestamp, angles = {} } = metrics;
    const now = timestamp || Date.now();

    // Validate state transition
    const validTransitions = this.stateTransitions[this.currentState] || [];
    const isValidTransition = validTransitions.includes(currentState);

    if (!isValidTransition && currentState !== this.currentState) {
      if (this.debugMode) {
        console.log(`Invalid transition from ${this.currentState} to ${currentState}`);
      }
      return {
        stateChanged: false,
        shouldCount: false,
        feedback: null
      };
    }

    // Check if state actually changed
    const stateChanged = currentState !== this.currentState;

    if (stateChanged) {
      this.lastTransitionTime = now;
      this.currentState = currentState;

      if (this.debugMode) {
        console.log(`State transition: ${this.currentState} at ${now}`);
      }
    }

    // Apply EMA smoothing to angles
    for (const [key, value] of Object.entries(angles)) {
      if (this.smoothedValues[key] !== undefined) {
        this.smoothedValues[key] = this._smooth(value, this.smoothedValues[key]);
      } else {
        this.smoothedValues[key] = value;
      }
    }

    return {
      stateChanged,
      shouldCount: this.shouldCountRep(now),
      feedback: null
    };
  }

  /**
   * Check if conditions are met to count a rep
   * @param {number} timestamp - Current timestamp (optional)
   * @returns {boolean}
   */
  shouldCountRep(timestamp = null) {
    const now = timestamp || Date.now();

    // Check minimum rep timing
    const timeSinceLastRep = now - this.lastRepTime;
    if (timeSinceLastRep < this.minRepMs) {
      if (this.debugMode) {
        console.log(`Rep too fast: ${timeSinceLastRep}ms < ${this.minRepMs}ms`);
      }
      return false;
    }

    // Check cooldown
    const timeSinceTransition = now - this.lastTransitionTime;
    if (timeSinceTransition < this.cooldownMs) {
      if (this.debugMode) {
        console.log(`In cooldown: ${timeSinceTransition}ms < ${this.cooldownMs}ms`);
      }
      return false;
    }

    // Update last rep time if counting
    this.lastRepTime = now;
    this.inCooldown = true;

    if (this.debugMode) {
      console.log(`Rep counted at ${now}`);
    }

    return true;
  }

  /**
   * Reset tracker state (e.g., on exercise mode change)
   */
  reset() {
    this.currentState = 'up';
    this.lastTransitionTime = 0;
    this.lastRepTime = 0;
    this.smoothedValues = {};
    this.inCooldown = false;

    if (this.debugMode) {
      console.log('RepTracker reset');
    }
  }

  /**
   * Get current state for debugging
   * @returns {Object} - Internal state snapshot
   */
  getDebugInfo() {
    return {
      currentState: this.currentState,
      lastTransitionTime: this.lastTransitionTime,
      lastRepTime: this.lastRepTime,
      smoothedValues: { ...this.smoothedValues },
      inCooldown: this.inCooldown,
      config: {
        minRepMs: this.minRepMs,
        emaAlpha: this.emaAlpha,
        cooldownMs: this.cooldownMs,
        stateTransitions: this.stateTransitions
      }
    };
  }

  /**
   * Apply EMA smoothing to a value
   * @param {number} newValue - New measurement
   * @param {number} oldValue - Previous smoothed value
   * @returns {number} - Smoothed value
   * @private
   */
  _smooth(newValue, oldValue) {
    // EMA formula: alpha * new + (1 - alpha) * old
    return this.emaAlpha * newValue + (1 - this.emaAlpha) * oldValue;
  }
}

// Pose detection utilities using MediaPipe
class PoseDetectionUtils {
  constructor() {
    this.pose = null;
    this.detector = null; // TFJS BlazePose detector when using alternative backend
    this.isInitialized = false;
    // Backend selection: 'mediapipe' (default) or 'blazepose_tfjs'
    this.backend = (window.MediaPipeConfig?.POSE_BACKEND) || 'mediapipe';
    // Per-exercise state to avoid cross-contamination between different exercises
    // Structure: { <mode>: { state: 'up'|'down'|'neutral'|..., count: number, extra... } }
    this.perModeState = {};
    const initMode = (mode) => ({ state: 'up', count: 0 });
    this.perModeState['pushups'] = initMode('pushups');
    this.perModeState['squats'] = initMode('squats');
    this.perModeState['lunges'] = initMode('lunges');
    this.perModeState['burpees'] = initMode('burpees');
    // Keep existing exercises from HEAD and add new exercises from new-exercise branch
    this.perModeState['situps'] = { state: 'neutral', count: 0, _lastTorsoAngle: null, _situpState: 'neutral', _lastSitupTime: 0 };
    this.perModeState['highknees'] = { state: 'down', count: 0 };
    this.perModeState['jumpingjacks'] = { state: 'down', count: 0 };
    this.perModeState['sideplank'] = { state: 'neutral', count: 0, _stableCount: 0, _lastHipY: null, _lastShoulderY: null, _lastAnkleY: null, _lastTimestamp: 0 };
    this.perModeState['plank'] = { state: 'neutral', count: 0, _stableCount: 0, _lastHipY: null, _lastShoulderY: null, _lastAnkleY: null, _lastTimestamp: 0 };
    // New exercises from new-exercise branch
    this.perModeState['widepushups'] = initMode('widepushups');
    this.perModeState['narrowpushups'] = initMode('narrowpushups');
    this.perModeState['diamondpushups'] = initMode('diamondpushups');
    this.perModeState['kneepushups'] = initMode('kneepushups');
    this.perModeState['straightarmplank'] = { state: 'neutral', count: 0 };
    this.perModeState['reversestraightarmplank'] = { state: 'neutral', count: 0 };
    this.perModeState['kneeplank'] = { state: 'neutral', count: 0 };
    this.perModeState['wallsit'] = { state: 'neutral', count: 0 };
    this.postureStatus = 'unknown'; // correct, incorrect, unknown
    this.lastWarningTime = 0;
    this.videoDimensionsLogged = false;
    // Exercise mode and timing
    this.exerciseMode = 'pushups'; // 'pushups' | 'plank' | 'squats' | 'lunges'
    this.accumulatedCorrectMs = 0;
    this.timerRunning = false;
    this.startCorrectTimestampMs = 0;
    this.onPushupCount = null;
    this.onPostureChange = null;
    this.onFormFeedback = null;
    this.onTimeUpdate = null; // for plank seconds updates
    
    // Landmark history for EMA backfilling - circular buffer storing recent landmarks per index
    // Structure: { landmarkIndex: [landmark1, landmark2, ...] }
    this._landmarkHistory = {};
    this._landmarkHistorySize = 5; // Maximum frames to store per landmark
    
    // Calibration data storing baseline measurements
    this.calibrationData = null;
    
    // Telemetry system for debugging and validation
    this.telemetryEnabled = false; // Default disabled for production
    this._frameNumber = 0; // Track frame count for telemetry
    this._lastRepTimestamp = 0; // Track last rep time for cadence anomaly detection
    this._repTimings = []; // Store recent rep timings for cadence analysis
    this._maxRepTimingsHistory = 10; // Keep last 10 rep timings
  }



  // Initialize MediaPipe Pose
  async initialize() {
    try {
      console.log('🚀 Initializing Pose backend...', this.backend);

      // Alternative backend: TFJS BlazePose (fast init, accurate keypoints)
      if (this.backend === 'blazepose_tfjs') {
        console.log('📦 Loading TensorFlow.js BlazePose backend...');
        
        // Dynamically import TFJS and pose-detection from CDN as configured
        const cfg = window.MediaPipeConfig || {};
        console.log('🔧 MediaPipe config:', cfg);
        
        const tfCoreUrl = cfg.TFJS_CORE_URL || 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.10.0/dist/tf-core.esm.js';
        const tfConverterUrl = cfg.TFJS_CONVERTER_URL || 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.10.0/dist/tf-converter.esm.js';
        const tfWebglUrl = cfg.TFJS_BACKEND_WEBGL_URL || 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.10.0/dist/tf-backend-webgl.esm.js';
        const poseDetectionUrl = cfg.POSE_DETECTION_URL || 'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.js';

        try {
          // Load TFJS modules with better error handling
          console.log('📥 Loading TensorFlow.js core from:', tfCoreUrl);
          const tf = await import(/* @vite-ignore */ tfCoreUrl);
          
          if (!tf || !tf.setBackend) {
            throw new Error('TensorFlow.js core failed to load properly');
          }
          console.log('✅ TensorFlow.js core loaded');
          
          console.log('📥 Loading TensorFlow.js converter from:', tfConverterUrl);
          await import(/* @vite-ignore */ tfConverterUrl);
          console.log('✅ TensorFlow.js converter loaded');
          
          console.log('📥 Loading TensorFlow.js WebGL backend from:', tfWebglUrl);
          await import(/* @vite-ignore */ tfWebglUrl);
          console.log('✅ TensorFlow.js WebGL backend loaded');
          
          console.log('🔧 Setting backend to WebGL...');
          await tf.setBackend('webgl');
          console.log('⏳ Waiting for TensorFlow.js to be ready...');
          await tf.ready();
          console.log('✅ TensorFlow.js is ready!');

          console.log('📥 Loading pose detection from:', poseDetectionUrl);
          const poseDetection = await import(/* @vite-ignore */ poseDetectionUrl);
          
          if (!poseDetection) {
            throw new Error('Pose detection library failed to load');
          }
          console.log('✅ Pose detection library loaded');
          console.log('🎯 Available models:', Object.keys(poseDetection.SupportedModels || {}));

          const modelType = cfg.BLAZEPOSE_MODEL_TYPE || 'lite'; // 'lite'|'full'|'heavy'
          console.log('🏗️ Creating BlazePose detector with model type:', modelType);
          
          // Check if BlazePose model is available
          if (!poseDetection.SupportedModels || !poseDetection.SupportedModels.BlazePose) {
            console.warn('⚠️ BlazePose model not found, available models:', Object.keys(poseDetection.SupportedModels || {}));
            throw new Error('BlazePose model not found in pose detection library');
          }
          
          this.detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.BlazePose,
            {
              runtime: 'tfjs',
              modelType,
              enableSmoothing: true
            }
          );

          if (!this.detector) {
            throw new Error('Failed to create BlazePose detector');
          }

          this.isInitialized = true;
          console.log('✅ TFJS BlazePose initialized successfully!');
          return true;
          
        } catch (tfError) {
          console.error('❌ TensorFlow.js/BlazePose loading failed:', tfError);
          console.error('Error details:', {
            message: tfError.message,
            stack: tfError.stack,
            name: tfError.name
          });
          
          // Try fallback to MediaPipe if TensorFlow.js fails
          console.log('🔄 Attempting fallback to MediaPipe backend...');
          this.backend = 'mediapipe';
          // Continue to MediaPipe initialization below
        }
      }

      // Default backend: MediaPipe classic Pose
      console.log('🚀 Initializing MediaPipe Pose...');

      // Wait for MediaPipe to load if not ready
      if (!window.Pose) {
        console.warn('MediaPipe Pose not loaded yet, waiting...');
        // Wait up to 10 seconds for MediaPipe to load
        let attempts = 0;
        while (!window.Pose && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
          if (attempts % 10 === 0) {
            console.log(`Still waiting for MediaPipe... (${attempts * 200}ms)`);
          }
        }

        if (!window.Pose) {
          console.error('MediaPipe Pose failed to load after waiting');
          return false;
        }
      }

      console.log('✅ MediaPipe Pose found in window object');
      // Ensure global Module exists for Mediapipe assets loader
      // Some builds of pose_solution_assets_loader.js expect a global `Module`
      // with `locateFile` and `dataFileDownloads` set.
      if (!window.Module) {
        window.Module = {};
      }
      if (!window.Module.locateFile) {
        window.Module.locateFile = (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
      if (!window.Module["dataFileDownloads"]) {
        window.Module["dataFileDownloads"] = {};
      }

      this.pose = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });

      const config = window.MediaPipeConfig?.POSE_CONFIG || {
        modelComplexity: 0,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      };

      this.pose.setOptions(config);
      this.pose.onResults(this.onResults.bind(this));

      this.isInitialized = true;
      console.log('MediaPipe Pose initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MediaPipe Pose:', error);
      return false;
    }
  }

  /**
   * Validate and backfill landmark visibility using EMA smoothing
   * @param {Array} landmarks - Current frame landmarks
   * @param {Array} criticalIndices - Required landmark indices for the exercise
   * @param {number} minVisibility - Minimum visibility threshold (0-1)
   * @returns {Array|null} - Validated/backfilled landmarks or null if cannot be backfilled
   */
  validateAndBackfillLandmarks(landmarks, criticalIndices, minVisibility = 0.35) {
    if (!landmarks || !criticalIndices || criticalIndices.length === 0) {
      return null;
    }

    // Create a copy of landmarks to avoid mutating the original
    const validated = [...landmarks];
    const emaAlpha = 0.3; // EMA smoothing factor

    // Check each critical landmark
    for (const idx of criticalIndices) {
      const landmark = landmarks[idx];

      // Check if landmark exists and has sufficient visibility
      if (!landmark || landmark.visibility < minVisibility) {
        // Try to backfill with EMA-smoothed value from history
        if (this._landmarkHistory[idx] && this._landmarkHistory[idx].length > 0) {
          // Get the most recent landmark from history
          const history = this._landmarkHistory[idx];
          const lastLandmark = history[history.length - 1];

          // Create backfilled landmark with reduced visibility to indicate it's estimated
          validated[idx] = {
            x: lastLandmark.x,
            y: lastLandmark.y,
            z: lastLandmark.z || 0,
            visibility: 0.3, // Mark as backfilled with lower confidence
            backfilled: true // Flag to indicate this is a backfilled value
          };

          if (Math.random() < 0.05) { // Log occasionally to avoid spam
            console.log(`🔄 Backfilled landmark ${idx} with visibility ${landmark?.visibility || 0} using history`);
          }
        } else {
          // No history available, cannot backfill - frame is invalid
          if (Math.random() < 0.05) {
            console.log(`❌ Cannot backfill landmark ${idx} - no history available`);
          }
          return null;
        }
      } else {
        // Landmark is valid, update history
        this._updateLandmarkHistory(idx, landmark);
      }
    }

    return validated;
  }

  /**
   * Update landmark history with new landmark using circular buffer
   * @param {number} idx - Landmark index
   * @param {Object} landmark - Landmark object with x, y, z, visibility
   * @private
   */
  _updateLandmarkHistory(idx, landmark) {
    // Initialize history array for this landmark if it doesn't exist
    if (!this._landmarkHistory[idx]) {
      this._landmarkHistory[idx] = [];
    }

    const history = this._landmarkHistory[idx];
    const emaAlpha = 0.3; // EMA smoothing factor

    // If we have history, apply EMA smoothing
    if (history.length > 0) {
      const lastLandmark = history[history.length - 1];
      
      // Apply EMA smoothing: alpha * new + (1 - alpha) * old
      const smoothedLandmark = {
        x: emaAlpha * landmark.x + (1 - emaAlpha) * lastLandmark.x,
        y: emaAlpha * landmark.y + (1 - emaAlpha) * lastLandmark.y,
        z: emaAlpha * (landmark.z || 0) + (1 - emaAlpha) * (lastLandmark.z || 0),
        visibility: landmark.visibility,
        timestamp: Date.now()
      };

      history.push(smoothedLandmark);
    } else {
      // First landmark, no smoothing needed
      history.push({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z || 0,
        visibility: landmark.visibility,
        timestamp: Date.now()
      });
    }

    // Maintain circular buffer - remove oldest if exceeds max size
    if (history.length > this._landmarkHistorySize) {
      history.shift(); // Remove oldest landmark
    }
  }

  /**
   * Calibrate the pose detection system by collecting baseline measurements
   * @param {number} durationMs - Duration to collect calibration data in milliseconds
   * @returns {Promise<Object>} - Calibration data with baseline measurements
   */
  async calibrate(durationMs = 3000) {
    console.log('🎯 Starting calibration for', durationMs, 'ms');
    
    const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
    const calibrationDefaults = window.MediaPipeConfig?.CALIBRATION_DEFAULTS || {};
    
    const startTime = Date.now();
    const measurements = {
      shoulderWidths: [],
      ankleSpacings: [],
      torsoLengths: [],
      timestamps: []
    };
    
    // Frame collection loop
    while (Date.now() - startTime < durationMs) {
      // Wait for next frame (approximately 30fps)
      await new Promise(resolve => setTimeout(resolve, 33));
      
      // Get current landmarks from last processed frame
      if (!this.lastResults || !this.lastResults.poseLandmarks) {
        continue;
      }
      
      const landmarks = this.lastResults.poseLandmarks;
      
      // Extract required landmarks
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];
      const leftAnkle = landmarks[config.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[config.RIGHT_ANKLE || 28];
      
      // Check visibility of critical landmarks
      const minVisibility = 0.5;
      if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || 
          leftShoulder.visibility < minVisibility || rightShoulder.visibility < minVisibility ||
          leftHip.visibility < minVisibility || rightHip.visibility < minVisibility) {
        continue;
      }
      
      // Compute shoulder width (Euclidean distance)
      const shoulderWidth = Math.sqrt(
        Math.pow(rightShoulder.x - leftShoulder.x, 2) +
        Math.pow(rightShoulder.y - leftShoulder.y, 2)
      );
      
      // Compute neutral ankle spacing (if ankles visible)
      let ankleSpacing = null;
      if (leftAnkle && rightAnkle && 
          leftAnkle.visibility >= minVisibility && rightAnkle.visibility >= minVisibility) {
        ankleSpacing = Math.sqrt(
          Math.pow(rightAnkle.x - leftAnkle.x, 2) +
          Math.pow(rightAnkle.y - leftAnkle.y, 2)
        );
      }
      
      // Compute torso length (shoulder midpoint to hip midpoint)
      const shoulderMidpoint = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipMidpoint = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      const torsoLength = Math.sqrt(
        Math.pow(hipMidpoint.x - shoulderMidpoint.x, 2) +
        Math.pow(hipMidpoint.y - shoulderMidpoint.y, 2)
      );
      
      // Accumulate measurements
      measurements.shoulderWidths.push(shoulderWidth);
      if (ankleSpacing !== null) {
        measurements.ankleSpacings.push(ankleSpacing);
      }
      measurements.torsoLengths.push(torsoLength);
      measurements.timestamps.push(Date.now());
    }
    
    // Check if we have enough stable frames
    const minStableFrames = calibrationDefaults.minStableFrames || 30;
    if (measurements.shoulderWidths.length < minStableFrames) {
      console.warn('⚠️ Insufficient stable frames for calibration:', measurements.shoulderWidths.length);
      // Return defaults if calibration failed
      this.calibrationData = {
        shoulderWidth: calibrationDefaults.shoulderWidth || 0.2,
        neutralAnkleSpacing: calibrationDefaults.neutralAnkleSpacing || 0.12,
        torsoLength: calibrationDefaults.torsoLength || 0.3,
        timestamp: Date.now(),
        isDefault: true,
        frameCount: measurements.shoulderWidths.length
      };
    } else {
      // Compute averages across stable frames
      const avgShoulderWidth = measurements.shoulderWidths.reduce((a, b) => a + b, 0) / measurements.shoulderWidths.length;
      const avgAnkleSpacing = measurements.ankleSpacings.length > 0
        ? measurements.ankleSpacings.reduce((a, b) => a + b, 0) / measurements.ankleSpacings.length
        : calibrationDefaults.neutralAnkleSpacing || 0.12;
      const avgTorsoLength = measurements.torsoLengths.reduce((a, b) => a + b, 0) / measurements.torsoLengths.length;
      
      // Store calibration data
      this.calibrationData = {
        shoulderWidth: avgShoulderWidth,
        neutralAnkleSpacing: avgAnkleSpacing,
        torsoLength: avgTorsoLength,
        timestamp: Date.now(),
        isDefault: false,
        frameCount: measurements.shoulderWidths.length
      };
      
      console.log('✅ Calibration complete:', this.calibrationData);
    }
    
    // Emit calibration-complete event
    const event = new CustomEvent('calibration-complete', {
      detail: this.calibrationData
    });
    window.dispatchEvent(event);
    
    return this.calibrationData;
  }

  /**
   * Emit telemetry event for debugging and validation
   * @param {Object} eventData - Telemetry event data
   * @private
   */
  _emitTelemetry(eventData) {
    if (!this.telemetryEnabled) {
      return;
    }

    // Ensure event has required structure
    const telemetryEvent = {
      type: eventData.type || 'pose-telemetry',
      timestamp: eventData.timestamp || Date.now(),
      exerciseMode: eventData.exerciseMode || this.exerciseMode,
      frameNumber: eventData.frameNumber !== undefined ? eventData.frameNumber : this._frameNumber,
      
      // Posture validation data
      posture: eventData.posture || null,
      
      // Landmark visibility data
      visibility: eventData.visibility || null,
      
      // Computed angles
      angles: eventData.angles || null,
      
      // State machine data
      state: eventData.state || null,
      
      // Form feedback
      feedback: eventData.feedback || null
    };

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pose-telemetry', {
      detail: telemetryEvent
    }));

    // Log occasionally for debugging (5% of frames)
    if (Math.random() < 0.05) {
      console.log('📊 Telemetry:', telemetryEvent.type, telemetryEvent);
    }
  }

  /**
   * Track rep timing and detect unrealistic cadence
   * @param {number} timestamp - Current timestamp
   * @returns {Object|null} - Anomaly data if detected, null otherwise
   * @private
   */
  _trackRepCadence(timestamp) {
    const now = timestamp || Date.now();
    
    // Calculate time since last rep
    const timeSinceLastRep = this._lastRepTimestamp > 0 ? now - this._lastRepTimestamp : null;
    
    if (timeSinceLastRep !== null) {
      // Add to rep timings history
      this._repTimings.push(timeSinceLastRep);
      
      // Maintain circular buffer
      if (this._repTimings.length > this._maxRepTimingsHistory) {
        this._repTimings.shift();
      }
      
      // Detect unrealistic cadence (physiologically impossible)
      const MIN_PHYSIOLOGICAL_REP_TIME = 200; // 200ms minimum between reps
      const MAX_PHYSIOLOGICAL_REP_TIME = 10000; // 10s maximum between reps
      
      if (timeSinceLastRep < MIN_PHYSIOLOGICAL_REP_TIME) {
        // Unrealistic cadence detected - too fast
        return {
          type: 'unrealistic-cadence',
          reason: 'too-fast',
          timeSinceLastRep,
          threshold: MIN_PHYSIOLOGICAL_REP_TIME,
          repTimings: [...this._repTimings]
        };
      }
      
      // Calculate average cadence if we have enough history
      if (this._repTimings.length >= 3) {
        const avgCadence = this._repTimings.reduce((a, b) => a + b, 0) / this._repTimings.length;
        
        // Detect sudden cadence changes (possible false positive)
        if (timeSinceLastRep < avgCadence * 0.3) {
          return {
            type: 'unrealistic-cadence',
            reason: 'sudden-acceleration',
            timeSinceLastRep,
            averageCadence: avgCadence,
            repTimings: [...this._repTimings]
          };
        }
      }
    }
    
    // Update last rep timestamp
    this._lastRepTimestamp = now;
    
    return null;
  }

  // Knee push-up counter: exact copy of push-up logic scoped to perModeState['kneepushups']
  updateKneePushupCounter(landmarks){
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const pushupConfig = window.MediaPipeConfig?.PUSHUP_CONFIG || {};
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const leftElbow = landmarks[config.LEFT_ELBOW || 13];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const rightElbow = landmarks[config.RIGHT_ELBOW || 14];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];

      if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist || !leftHip || !rightHip) {
        return;
      }

      // Calculate elbow angles
      const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
      const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

      // Average shoulder position (for height detection)
      const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;

      const downThreshold = pushupConfig.ELBOW_ANGLE_DOWN || 95;
      const upThreshold = pushupConfig.ELBOW_ANGLE_UP || 155;
      const shoulderHeightThreshold = pushupConfig.SHOULDER_HEIGHT_DOWN || 0.02;

      // Push-up position: elbows bent OR shoulders close to ground
      // Determine if user is likely standing: if shoulders are well above hips and torso vertical
      const shoulderHipDy = Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftHip.y + rightHip.y) / 2));
      const torsoVerticalThreshold = pushupConfig.TORSO_VERTICAL_DY ?? 0.15; // if shoulders far above hips (normalized units)
      const isLikelyStanding = shoulderHipDy < (pushupConfig.STANDING_DY_MIN ?? 0.05) ? false : ((leftShoulder.y + rightShoulder.y) / 2) < ((leftHip.y + rightHip.y) / 2) - (pushupConfig.STANDING_DY_MIN ?? 0.02);

      // Baseline shoulder level (approx when 'up' state) — store per-mode baseline
      const pstate = this.perModeState['widepushups'];
      if (!pstate._baselineShoulderY) {
        // initialize baseline to current shoulder Y when pose roughly horizontal
        pstate._baselineShoulderY = avgShoulderY;
      }

      // If posture is not horizontal, don't update baseline; else slowly adapt baseline
      if (Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftHip.y + rightHip.y) / 2)) < 0.12) {
        // adapt baseline slowly
        pstate._baselineShoulderY = (pstate._baselineShoulderY * 0.95) + (avgShoulderY * 0.05);
      }

      // Push-up position: significant drop from baseline OR elbow angle threshold
      const shoulderDrop = avgShoulderY - (pstate._baselineShoulderY || avgShoulderY);
      const shoulderDropThreshold = pushupConfig.SHOULDER_DROP_THRESHOLD ?? 0.06; // normalized units
      const pushupPosition = (avgElbowAngle <= downThreshold) || (shoulderDrop >= shoulderDropThreshold) || (avgShoulderY >= (1 - shoulderHeightThreshold));

      // Standing position: elbows straight and shoulders high (not horizontal)
      const standingPosition = (avgElbowAngle >= upThreshold) && isLikelyStanding;

      // In-position gating: require user to assume a stable push-up start pose before starting counting
      if (!pstate._inPositionCount) pstate._inPositionCount = 0;
      const inStart = this.isPushupStartPose(landmarks);
      if (inStart) {
        pstate._inPositionCount += 1;
      } else {
        pstate._inPositionCount = 0;
      }

      const REQUIRED_STABLE_FRAMES = window.MediaPipeConfig?.PUSHUP_CONFIG?.START_STABLE_FRAMES ?? 6; // ~6 frames
      pstate._isInStartPose = pstate._inPositionCount >= REQUIRED_STABLE_FRAMES;

      // Debounce reps: minimum ms between consecutive counts
      const MIN_REP_MS = window.MediaPipeConfig?.PUSHUP_CONFIG?.MIN_REP_MS ?? 400;
      if (!pstate._lastRepAt) pstate._lastRepAt = 0;
      const now = Date.now();

      // Only count if posture is correct and user is in start pose
      if (this.postureStatus !== 'correct' || !pstate._isInStartPose) {
        return; // do not count
      }

      if (pstate.state === 'up') {
        if (pushupPosition && (now - pstate._lastRepAt) > MIN_REP_MS) {
          pstate.state = 'down';
          pstate.count += 1; // Count on descent
          pstate._lastRepAt = now;
          this.playSuccessSound(); // Play success sound
          if (this.onPushupCount) this.onPushupCount(pstate.count);
          if (this.onFormFeedback) {
            this.onFormFeedback({ message: `Wide Push-up ${pstate.count}`, type: 'success', timestamp: now });
          }
        }
      } else if (pstate.state === 'down') {
        // return to up when standingPosition or full extension detected
        if (standingPosition || (!pushupPosition && avgElbowAngle >= upThreshold)) {
          pstate.state = 'up'; // Reset state for next rep
        }
      }
    } catch (error) {
      console.error('Error updating wide push-up counter:', error);
    }
  }


  // Process video frame
  async processFrame(videoElement) {
    if (!this.isInitialized) {
      console.log('❌ Pose not initialized');
      return null;
    }

    // Increment frame counter for telemetry
    this._frameNumber++;

    try {
      // Only log occasionally to avoid spam
      if (Math.random() < 0.05) {
        console.log('📹 Processing frame...');
      }

      // Check if video dimensions are reasonable
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        if (Math.random() < 0.1) {
          console.log('⏳ Video dimensions not ready yet');
        }
        return;
      }

      // Log video dimensions only once per session
      if (!this.videoDimensionsLogged) {
        console.log(`📏 Video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
        this.videoDimensionsLogged = true;
      }

      // Allow larger videos but with a reasonable limit
      const maxWidth = 1920;
      const maxHeight = 1080;
      if (videoElement.videoWidth > maxWidth || videoElement.videoHeight > maxHeight) {
        console.log('⚠️ Video too large (>1920x1080), skipping frame');
        return;
      }

      // Branch per backend
      if (this.backend === 'blazepose_tfjs' && this.detector) {
        const poses = await this.detector.estimatePoses(videoElement, { flipHorizontal: true });
        const pose = poses && poses[0];
        const keypoints = pose?.keypoints || pose?.keypoints3D || [];
        if (!keypoints || keypoints.length === 0) {
          this.onResults({ poseLandmarks: null });
          return;
        }
        const w = videoElement.videoWidth || 1;
        const h = videoElement.videoHeight || 1;
        // Normalize to [0,1] like MediaPipe Pose, include visibility from score
        const landmarks = keypoints.map(kp => ({
          x: Math.max(0, Math.min(1, (kp.x || 0) / w)),
          y: Math.max(0, Math.min(1, (kp.y || 0) / h)),
          z: kp.z ?? 0,
          visibility: kp.score ?? kp.visibility ?? 0.8
        }));
        this.onResults({ poseLandmarks: landmarks });
      } else if (this.pose) {
        await this.pose.send({ image: videoElement });
      }
    } catch (error) {
      if (error.message?.includes('memory access out of bounds')) {
        console.warn('🔄 Memory error, skipping frame');
        return;
      }
      console.error('Error processing frame:', error);
    }
  }

  // Handle pose detection results
  onResults(results) {
    console.log('🎯 onResults called!', results.poseLandmarks ? `Found ${results.poseLandmarks.length} landmarks` : 'No landmarks');

    // Store results for drawing
    this.lastResults = results;

    if (!results.poseLandmarks) {
      this.postureStatus = 'unknown';
      if (this.onPostureChange) {
        this.onPostureChange('unknown', null);
      }
      
      // Emit telemetry for frame-skipped event
      this._emitTelemetry({
        type: 'pose-frame-skipped',
        timestamp: Date.now(),
        frameNumber: this._frameNumber,
        reason: 'no-landmarks-detected',
        posture: {
          isValid: false,
          reason: 'no_landmarks'
        }
      });
      
      // Stop plank timer if running
      if (this.timerRunning) {
        this.accumulatedCorrectMs += Date.now() - this.startCorrectTimestampMs;
        this.timerRunning = false;
        this.startCorrectTimestampMs = 0;
        if (this.onTimeUpdate) {
          this.onTimeUpdate(Math.floor(this.accumulatedCorrectMs / 1000));
        }
      }
      return;
    }

    const landmarks = results.poseLandmarks;
    
    // Get critical landmarks for visibility validation
    const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
    const criticalLandmarksMap = window.MediaPipeConfig?.CRITICAL_LANDMARKS_MAP || {};
    const criticalIndices = criticalLandmarksMap[this.exerciseMode] || [11, 12, 13, 14, 23, 24, 25, 26];
    
    // Validate and backfill landmarks
    const validatedLandmarks = this.validateAndBackfillLandmarks(landmarks, criticalIndices, 0.35);
    
    if (!validatedLandmarks) {
      // Emit telemetry for frame-skipped due to insufficient visibility
      const visibilityData = {};
      criticalIndices.forEach(idx => {
        const landmark = landmarks[idx];
        visibilityData[`landmark_${idx}`] = landmark ? landmark.visibility : 0;
      });
      
      this._emitTelemetry({
        type: 'pose-frame-skipped',
        timestamp: Date.now(),
        frameNumber: this._frameNumber,
        reason: 'insufficient-visibility',
        visibility: visibilityData,
        posture: {
          isValid: false,
          reason: 'insufficient_visibility'
        }
      });
      
      return;
    }

    // Evaluate posture for the current exercise using the unified checker with enhanced gating
    // Determine if cardio bypass should be allowed
    const cardioExercises = ['mountainclimbers', 'highknees', 'jumpingjacks'];
    const allowCardioBypass = cardioExercises.includes(this.exerciseMode);
    
    const postureResult = this.checkBackAlignment(validatedLandmarks, {
      exerciseMode: this.exerciseMode,
      isLiveWebcam: true,
      allowCardioBypass: allowCardioBypass
    });

    // Update posture status based on result
    const newStatus = postureResult.isValid ? 'correct' : 'incorrect';
    if (newStatus !== this.postureStatus) {
      this.postureStatus = newStatus;
      if (this.onPostureChange) {
        this.onPostureChange(this.postureStatus, validatedLandmarks);
      }
    }
    
    // Collect visibility data for telemetry
    const visibilityData = {};
    criticalIndices.forEach(idx => {
      const landmark = validatedLandmarks[idx];
      if (landmark) {
        visibilityData[`landmark_${idx}`] = landmark.visibility;
      }
    });
    
    // Collect angle data for telemetry (if available)
    const anglesData = {};
    const currentState = this.perModeState[this.exerciseMode];
    
    // Get current rep count and state
    const stateData = {
      current: currentState?.state || 'unknown',
      repCount: currentState?.count || 0
    };

    // If posture is incorrect for strength/technique exercises, warn and normally skip counting.
    // However, allow deep squat descents (hip below knee) to proceed to the squat counter so
    // counting can occur if legs are stable. The squat counter itself still enforces stability
    // and collapse checks.
    // Also skip posture warnings and counting block for Sit-Ups (allow counting even if back not perfectly straight)
    if (!postureResult.isValid && !cardioExercises.includes(this.exerciseMode) && this.exerciseMode !== 'squats' && this.exerciseMode !== 'situps') {
      const currentTime = Date.now();
      const cooldown = window.MediaPipeConfig?.PLANK_CONFIG?.WARNING_COOLDOWN || 2000;

      if (currentTime - this.lastWarningTime > cooldown) {
        this.playWarningSound();
        this.lastWarningTime = currentTime;

        if (this.onFormFeedback) {
          this.onFormFeedback({
            message: postureResult.feedback || "Dangerous posture - straighten your back!",
            type: "warning",
            timestamp: currentTime
          });
        }
      }

      // Stop plank timer while incorrect (include reverse plank)
      if ((this.exerciseMode === 'plank' || this.exerciseMode === 'sideplank') && this.timerRunning) {
        this.accumulatedCorrectMs += currentTime - this.startCorrectTimestampMs;
        this.timerRunning = false;
        this.startCorrectTimestampMs = 0;
        if (this.onTimeUpdate) {
          this.onTimeUpdate(Math.floor(this.accumulatedCorrectMs / 1000));
        }
      }

      // Do not proceed to rep counting when posture is incorrect for non-cardio exercises
      return;
    }

    // Posture is correct - Handle time-based exercises (plank, sideplank, wallsit)
    if (this.exerciseMode === 'plank' || this.exerciseMode === 'sideplank' || this.exerciseMode === 'wallsit') {
      const now = Date.now();
      let exerciseOk = false;
      
      if (this.exerciseMode === 'plank' || this.exerciseMode === 'sideplank') {
        // For plank we require a stricter horizontal+stability check before counting time.
        exerciseOk = this.isPlankStrictAndStable(validatedLandmarks, now);
      } else if (this.exerciseMode === 'wallsit') {
        // For wall sit, validate knee and hip angles
        const cfg = window.MediaPipeConfig?.POSE_LANDMARKS || {};
        const wallsitCfg = window.MediaPipeConfig?.WALLSIT_CONFIG || {};
        
        const lh = validatedLandmarks[cfg.LEFT_HIP || 23];
        const rh = validatedLandmarks[cfg.RIGHT_HIP || 24];
        const lk = validatedLandmarks[cfg.LEFT_KNEE || 25];
        const rk = validatedLandmarks[cfg.RIGHT_KNEE || 26];
        const la = validatedLandmarks[cfg.LEFT_ANKLE || 27];
        const ra = validatedLandmarks[cfg.RIGHT_ANKLE || 28];
        const ls = validatedLandmarks[cfg.LEFT_SHOULDER || 11];
        const rs = validatedLandmarks[cfg.RIGHT_SHOULDER || 12];
        
        if (lh && rh && lk && rk && la && ra && ls && rs) {
          // Calculate knee angles (hip-knee-ankle)
          const leftKneeAngle = this.calculateAngle(lh, lk, la);
          const rightKneeAngle = this.calculateAngle(rh, rk, ra);
          
          // Calculate hip angles (shoulder-hip-knee)
          const leftHipAngle = this.calculateAngle(ls, lh, lk);
          const rightHipAngle = this.calculateAngle(rs, rh, rk);
          
          // Check if angles are in valid range for WALL SIT
          // Different camera angles give different angle ranges:
          // Side view: bent knee ~110-130°, sitting hip ~110-130°
          // Front view: bent knee ~80-120°, sitting hip ~80-120°
          // Use wider ranges to work with both camera angles
          const kneeMin = 80;   // Bent knee minimum (works for front and side)
          const kneeMax = 150;  // Bent knee maximum (works for front and side)
          const hipMin = 80;    // Sitting position minimum (works for front and side)
          const hipMax = 150;   // Sitting position maximum (works for front and side)
          
          const leftKneeOK = leftKneeAngle >= kneeMin && leftKneeAngle <= kneeMax;
          const rightKneeOK = rightKneeAngle >= kneeMin && rightKneeAngle <= kneeMax;
          const leftHipOK = leftHipAngle >= hipMin && leftHipAngle <= hipMax;
          const rightHipOK = rightHipAngle >= hipMin && rightHipAngle <= hipMax;
          
          // For wall sit, we need at least ONE side to be valid (in case of occlusion)
          // OR both knees valid (for front-facing camera)
          const kneesOK = leftKneeOK && rightKneeOK;  // Both knees valid
          const hipsOK = leftHipOK && rightHipOK;     // Both hips valid
          const oneSideOK = (leftKneeOK && leftHipOK) || (rightKneeOK && rightHipOK); // One complete side
          
          // Accept if both sides are good OR at least one complete side is good
          exerciseOk = (kneesOK && hipsOK) || oneSideOK;
          
          if (exerciseOk) {
            console.log('🪑✅ Wall sit: Valid position detected!', {
              leftKnee: leftKneeAngle.toFixed(1),
              rightKnee: rightKneeAngle.toFixed(1),
              leftHip: leftHipAngle.toFixed(1),
              rightHip: rightHipAngle.toFixed(1)
            });
          } else {
            console.log('🪑❌ Wall sit: Invalid position', {
              leftKnee: leftKneeAngle.toFixed(1),
              rightKnee: rightKneeAngle.toFixed(1),
              leftHip: leftHipAngle.toFixed(1),
              rightHip: rightHipAngle.toFixed(1),
              kneesOK,
              hipsOK
            });
          }
        }
      }

      if (exerciseOk) {
        if (!this.timerRunning) {
          this.startCorrectTimestampMs = now;
          this.timerRunning = true;
          console.log('🪑✅ Wall sit: Timer STARTED!');
        }
        const totalMs = this.accumulatedCorrectMs + (now - (this.startCorrectTimestampMs || now));
        const seconds = Math.floor(totalMs / 1000);
        console.log(`🪑⏱️ Wall sit: Counting... ${seconds} seconds`);
        if (this.onTimeUpdate) {
          this.onTimeUpdate(seconds);
          console.log(`🪑📢 Wall sit: Called onTimeUpdate with ${seconds}`);
        }
      } else {
        // Stop timer if it was running
        if (this.timerRunning) {
          this.accumulatedCorrectMs += now - this.startCorrectTimestampMs;
          this.timerRunning = false;
          this.startCorrectTimestampMs = 0;
          console.log(`🪑⏸️ Wall sit: Timer PAUSED at ${Math.floor(this.accumulatedCorrectMs / 1000)}s`);
          if (this.onTimeUpdate) {
            this.onTimeUpdate(Math.floor(this.accumulatedCorrectMs / 1000));
          }
        }
      }

      return;
    }

    // Emit telemetry for successfully processed frame
    this._emitTelemetry({
      type: 'pose-frame-processed',
      timestamp: Date.now(),
      frameNumber: this._frameNumber,
      posture: {
        isValid: postureResult.isValid,
        reason: postureResult.reason,
        orientation: postureResult.orientation
      },
      visibility: visibilityData,
      angles: anglesData,
      state: stateData,
      feedback: postureResult.feedback ? {
        type: postureResult.isValid ? 'info' : 'warning',
        message: postureResult.feedback
      } : null
    });

    // Count reps depending on mode
    if (this.exerciseMode === 'squats') {
      this.updateSquatCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'lunges') {
      this.updateLungesCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'burpees') {
      this.updateBurpeesCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'mountainclimbers') {
      // legacy mode - map to situps behavior
      this.updateSitUpsCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'situps') {
      console.log('🟢 onResults: situps mode active — calling updateSitupCounter');
      this.updateSitupCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'wallsit') {
      console.log('🟢 onResults: wallsit mode - calling updateWallSitCounter');
      this.updateWallSitCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'highknees') {
      console.log('🟢 onResults: highknees mode - calling updateHighKneesCounter');
      this.updateHighKneesCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'jumpingjacks') {
      console.log('🟢 onResults: jumpingjacks mode - calling updateJumpingJacksCounter');
      this.updateJumpingJacksCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'sideplank') {
      this.updateSidePlankCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'straightarmplank') {
      // Straight Arm Plank behaves like Side Plank for posture/time logic but uses its own handler
      this.updateStraightArmPlankCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'reversestraightarmplank') {
      // Reverse Straight Arm Plank is identical in logic to straight arm plank but separate mode/name
      this.updateReverseStraightArmPlankCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'kneeplank') {
      // Knee Plank: time-based like straight arm plank but with its own mode
      this.updateKneePlankCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'widepushups') {
      this.updateWidePushupCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'narrowpushups') {
      this.updateNarrowPushupCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'diamondpushups') {
      this.updateDiamondPushupCounter(validatedLandmarks);
    } else if (this.exerciseMode === 'kneepushups') {
      this.updateKneePushupCounter(validatedLandmarks);
    } else {
      this.updatePushupCounter(validatedLandmarks);
    }
  }

  // Allow external code to change exercise mode safely
  setExerciseMode(mode) {
    try {
      if (!mode) return;
      const normalized = String(mode).toLowerCase().replace(/[^a-z0-9]+/g, '');
      // Set normalized mode directly (reverse plank removed)
      this.exerciseMode = normalized;
      console.debug('PoseDetectionUtils: setExerciseMode ->', this.exerciseMode);
      // Ensure per-mode state exists
      if (!this.perModeState[normalized]) {
        this.perModeState[normalized] = { state: 'up', count: 0 };
      }
      // Reset counters for new mode
      this.resetCounter();
      return this.exerciseMode;
    } catch (e) {
      console.error('setExerciseMode error', e);
      return null;
    }
  }

  // Wide push-up counter: duplicate of pushup logic but with wider hand tolerance
  updateWidePushupCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const pushupConfig = window.MediaPipeConfig?.PUSHUP_CONFIG || {};
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const leftElbow = landmarks[config.LEFT_ELBOW || 13];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const rightElbow = landmarks[config.RIGHT_ELBOW || 14];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];

      if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist || !leftHip || !rightHip) {
        return;
      }

      // Calculate elbow angles
      const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
      const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

      // Average shoulder position (for height detection)
      const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;

      const downThreshold = pushupConfig.ELBOW_ANGLE_DOWN || 95;
      const upThreshold = pushupConfig.ELBOW_ANGLE_UP || 155;
      const shoulderHeightThreshold = pushupConfig.SHOULDER_HEIGHT_DOWN || 0.02;

      // Push-up position: elbows bent OR shoulders close to ground
      // Determine if user is likely standing: if shoulders are well above hips and torso vertical
      const shoulderHipDy = Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftHip.y + rightHip.y) / 2));
      const torsoVerticalThreshold = pushupConfig.TORSO_VERTICAL_DY ?? 0.15; // if shoulders far above hips (normalized units)
      const isLikelyStanding = shoulderHipDy < (pushupConfig.STANDING_DY_MIN ?? 0.05) ? false : ((leftShoulder.y + rightShoulder.y) / 2) < ((leftHip.y + rightHip.y) / 2) - (pushupConfig.STANDING_DY_MIN ?? 0.02);

      // Baseline shoulder level (approx when 'up' state) — store per-mode baseline
      const pstate = this.perModeState['widepushups'];
      if (!pstate._baselineShoulderY) {
        // initialize baseline to current shoulder Y when pose roughly horizontal
        pstate._baselineShoulderY = avgShoulderY;
      }

      // If posture is not horizontal, don't update baseline; else slowly adapt baseline
      if (Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftHip.y + rightHip.y) / 2)) < 0.12) {
        // adapt baseline slowly
        pstate._baselineShoulderY = (pstate._baselineShoulderY * 0.95) + (avgShoulderY * 0.05);
      }

      // Push-up position: significant drop from baseline OR elbow angle threshold
      const shoulderDrop = avgShoulderY - (pstate._baselineShoulderY || avgShoulderY);
      const shoulderDropThreshold = pushupConfig.SHOULDER_DROP_THRESHOLD ?? 0.06; // normalized units
      const pushupPosition = (avgElbowAngle <= downThreshold) || (shoulderDrop >= shoulderDropThreshold) || (avgShoulderY >= (1 - shoulderHeightThreshold));

      // Standing position: elbows straight and shoulders high (not horizontal)
      const standingPosition = (avgElbowAngle >= upThreshold) && isLikelyStanding;

      // In-position gating: require user to assume a stable push-up start pose before starting counting
      if (!pstate._inPositionCount) pstate._inPositionCount = 0;
      const inStart = this.isPushupStartPose(landmarks);
      if (inStart) {
        pstate._inPositionCount += 1;
      } else {
        pstate._inPositionCount = 0;
      }

      const REQUIRED_STABLE_FRAMES = window.MediaPipeConfig?.PUSHUP_CONFIG?.START_STABLE_FRAMES ?? 6; // ~6 frames
      pstate._isInStartPose = pstate._inPositionCount >= REQUIRED_STABLE_FRAMES;

      // Debounce reps: minimum ms between consecutive counts
      const MIN_REP_MS = window.MediaPipeConfig?.PUSHUP_CONFIG?.MIN_REP_MS ?? 400;
      if (!pstate._lastRepAt) pstate._lastRepAt = 0;
      const now = Date.now();

      // Only count if posture is correct and user is in start pose
      if (this.postureStatus !== 'correct' || !pstate._isInStartPose) {
        return; // do not count
      }

      if (pstate.state === 'up') {
        if (pushupPosition && (now - pstate._lastRepAt) > MIN_REP_MS) {
          pstate.state = 'down';
          pstate.count += 1; // Count on descent
          pstate._lastRepAt = now;
          this.playSuccessSound(); // Play success sound
          if (this.onPushupCount) this.onPushupCount(pstate.count);
          if (this.onFormFeedback) {
            this.onFormFeedback({ message: `Wide Push-up ${pstate.count}`, type: 'success', timestamp: now });
          }
        }
      } else if (pstate.state === 'down') {
        // return to up when standingPosition or full extension detected
        if (standingPosition || (!pushupPosition && avgElbowAngle >= upThreshold)) {
          pstate.state = 'up'; // Reset state for next rep
        }
      }
    } catch (error) {
      console.error('Error updating wide push-up counter:', error);
    }
  }

  // Calculate angle between three points
  calculateAngle(point1, point2, point3) {
    const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
      Math.atan2(point1.y - point2.y, point1.x - point2.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);

    if (angle > 180.0) {
      angle = 360 - angle;
    }

    return angle;
  }

  // Strict plank check: require near-horizontal torso and low movement across consecutive frames
  isPlankStrictAndStable(landmarks, nowMs) {
    try {
      const cfg = window.MediaPipeConfig?.PLANK_CONFIG || {};
      const LEFT_SHOULDER = cfg.LEFT_SHOULDER || 11;
      const RIGHT_SHOULDER = cfg.RIGHT_SHOULDER || 12;
      const LEFT_HIP = cfg.LEFT_HIP || 23;
      const RIGHT_HIP = cfg.RIGHT_HIP || 24;
      const LEFT_ANKLE = cfg.LEFT_ANKLE || 27;
      const RIGHT_ANKLE = cfg.RIGHT_ANKLE || 28;

      const leftShoulder = landmarks[LEFT_SHOULDER];
      const rightShoulder = landmarks[RIGHT_SHOULDER];
      const leftHip = landmarks[LEFT_HIP];
      const rightHip = landmarks[RIGHT_HIP];
      const leftAnkle = landmarks[LEFT_ANKLE];
      const rightAnkle = landmarks[RIGHT_ANKLE];

      const vis = (p) => p && (p.visibility == null || p.visibility > 0.5);
      // Require at least shoulders and hips on one side or both for reliable horizontal check
      const leftSideOk = vis(leftShoulder) && vis(leftHip);
      const rightSideOk = vis(rightShoulder) && vis(rightHip);
      if (!leftSideOk && !rightSideOk) return false;

      // Compute torso horizontal orientation (prefer side-view angle when available)
      let horizontalOk = false;
      const MIN_SIDE_ANGLE = cfg.MIN_SIDE_ANGLE ?? 155; // degrees
      if (vis(leftShoulder) && vis(leftHip) && vis(leftAnkle)) {
        const sideAngle = this.calculateAngle(leftShoulder, leftHip, leftAnkle);
        horizontalOk = sideAngle >= MIN_SIDE_ANGLE;
      } else if (vis(rightShoulder) && vis(rightHip) && vis(rightAnkle)) {
        const sideAngle = this.calculateAngle(rightShoulder, rightHip, rightAnkle);
        horizontalOk = sideAngle >= MIN_SIDE_ANGLE;
      } else {
        // front-facing fallback: shoulder-hip axis near horizontal
        const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
        const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
        const dx = shoulderCenter.x - hipCenter.x;
        const dy = shoulderCenter.y - hipCenter.y;
        const orientDeg = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
        // Allow slightly more tolerance for imperfect camera angles / small movements
        const HORIZ_MAX = cfg.HORIZ_MAX_DEG ?? 30;
        horizontalOk = (orientDeg <= HORIZ_MAX) || (orientDeg >= (180 - HORIZ_MAX));
      }

      if (!horizontalOk) return false;

      // Stability: ensure minimal movement in key points across consecutive frames
      // Use per-mode state so sideplank and plank maintain independent stability counters
      const state = this.perModeState[this.exerciseMode] || this.perModeState['plank'];
      const hipY = (leftHip.y + rightHip.y) / 2;
      const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      const ankleY = (leftAnkle && rightAnkle) ? ((leftAnkle.y + rightAnkle.y) / 2) : null;

      // Allow more movement per second (user may sway slightly) — increase default tolerance
      const maxDeltaPerSec = cfg.MAX_DELTA_PER_SEC ?? 0.25; // normalized units per second
      const now = nowMs || Date.now();
      const dt = Math.max(1, now - (state._lastTimestamp || now));

      let hipDelta = state._lastHipY == null ? 0 : Math.abs(hipY - state._lastHipY);
      let shoulderDelta = state._lastShoulderY == null ? 0 : Math.abs(shoulderY - state._lastShoulderY);
      let ankleDelta = (ankleY == null || state._lastAnkleY == null) ? 0 : Math.abs(ankleY - state._lastAnkleY);

      // Normalize deltas to per-second rates
      const hipRate = hipDelta * (1000 / dt);
      const shoulderRate = shoulderDelta * (1000 / dt);
      const ankleRate = ankleDelta * (1000 / dt);

      const motionTooHigh = (hipRate > maxDeltaPerSec) || (shoulderRate > maxDeltaPerSec) || (ankleY != null && ankleRate > maxDeltaPerSec);

      if (!motionTooHigh) {
        state._stableCount = (state._stableCount || 0) + 1;
      } else {
        state._stableCount = 0;
      }

      // Update last positions and timestamp for next frame
      state._lastHipY = hipY;
      state._lastShoulderY = shoulderY;
      if (ankleY != null) state._lastAnkleY = ankleY;
      state._lastTimestamp = now;

      // Require fewer consecutive 'stable' frames so small adjustments don't block counting
      const REQUIRED_STABLE_FRAMES = cfg.REQUIRED_STABLE_FRAMES ?? 4;
      const stableEnough = state._stableCount >= REQUIRED_STABLE_FRAMES;

      // Additionally enforce that user is not upright (filter out standing or knee-supported poses)
      // Use hip vs ankle vertical gap when ankles visible
      if (ankleY != null) {
        const hipAnkleDy = Math.abs(hipY - ankleY);
        // Reduce required hip-ankle gap so cameras that crop feet or users on soft surfaces still count
        const MIN_HIP_ANKLE_DY = cfg.MIN_HIP_ANKLE_DY ?? 0.06;
        if (hipAnkleDy < MIN_HIP_ANKLE_DY) return false;
      }

      return stableEnough;
    } catch (e) {
      console.error('isPlankStrictAndStable error', e);
      return false;
    }
  }

  // Detect stable push-up start pose: torso roughly horizontal and ankles visible (proxy for being on toes)
  isPushupStartPose(landmarks) {
    try {
      const cfg = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const leftShoulder = landmarks[cfg.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[cfg.RIGHT_SHOULDER || 12];
      const leftHip = landmarks[cfg.LEFT_HIP || 23];
      const rightHip = landmarks[cfg.RIGHT_HIP || 24];
      const leftAnkle = landmarks[cfg.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[cfg.RIGHT_ANKLE || 28];

      const vis = (p) => p && (p.visibility == null || p.visibility > 0.5);
      if (!vis(leftShoulder) || !vis(rightShoulder) || !vis(leftHip) || !vis(rightHip) || !vis(leftAnkle) || !vis(rightAnkle)) {
        return false;
      }

      const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
      const hipCenterY = (leftHip.y + rightHip.y) / 2;

      // torso vertical difference small -> near horizontal
      const torsoDy = Math.abs(shoulderCenterY - hipCenterY);
      const THRESH = window.MediaPipeConfig?.PUSHUP_CONFIG?.START_TORSO_DY ?? 0.08;
      if (torsoDy > THRESH) return false;

      // ankles visible and reasonably below hips (on toes) as an extra proxy
      const ankleBelowHip = ((leftAnkle.y + rightAnkle.y) / 2) > hipCenterY;
      if (!ankleBelowHip) return false;

      return true;
    } catch (e) {
      return false;
    }
  }

  // Detect stable squat start pose: standing upright with hips above knees and torso approximately vertical
  isSquatStartPose(landmarks) {
    try {
      const cfg = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const leftShoulder = landmarks[cfg.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[cfg.RIGHT_SHOULDER || 12];
      const leftHip = landmarks[cfg.LEFT_HIP || 23];
      const rightHip = landmarks[cfg.RIGHT_HIP || 24];
      const leftKnee = landmarks[cfg.LEFT_KNEE || 25];
      const rightKnee = landmarks[cfg.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[cfg.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[cfg.RIGHT_ANKLE || 28];

      const vis = (p) => p && (p.visibility == null || p.visibility > 0.5);
      // Require shoulders, hips and knees for a reliable standing start pose.
      // Ankles are optional because many webcams/cameras crop the feet.
      if (!vis(leftShoulder) || !vis(rightShoulder) || !vis(leftHip) || !vis(rightHip) || !vis(leftKnee) || !vis(rightKnee)) {
        return false;
      }

      const hipY = (leftHip.y + rightHip.y) / 2;
      const kneeY = (leftKnee.y + rightKnee.y) / 2;
      // In normalized coordinates hip above knee when standing
      const gap = kneeY - hipY; // positive when hip above knee
      const GAP_MIN = window.MediaPipeConfig?.SQUAT_CONFIG?.START_HIP_KNEE_GAP ?? 0.01;
      if (gap < GAP_MIN) return false;

      // Torso should be roughly vertical when standing
      const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
      const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
      const dx = shoulderCenter.x - hipCenter.x;
      const dy = shoulderCenter.y - hipCenter.y;
      const angDeg = Math.abs(Math.atan2(dx, -dy) * 180 / Math.PI); // similar to torso tilt in squat logic
      const MIN_VERT = window.MediaPipeConfig?.SQUAT_CONFIG?.STANDING_TORSO_MIN_DEG ?? 60;
      const MAX_VERT = window.MediaPipeConfig?.SQUAT_CONFIG?.STANDING_TORSO_MAX_DEG ?? 120;
      if (angDeg < MIN_VERT || angDeg > MAX_VERT) return false;

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check back alignment for posture with enhanced gating
   * @param {Array} landmarks - MediaPipe pose landmarks
   * @param {Object} options - Gating configuration
   * @param {string} options.exerciseMode - Current exercise type (overrides this.exerciseMode)
   * @param {boolean} options.isLiveWebcam - Live vs video processing
   * @param {boolean} options.allowCardioBypass - Skip posture for cardio
   * @returns {Object} - { isValid, reason, orientation, feedback }
   */
  checkBackAlignment(landmarks, options = {}) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      
      // Use options.exerciseMode if provided, otherwise fall back to this.exerciseMode
      const exerciseMode = options.exerciseMode || this.exerciseMode;
      const isLiveWebcam = options.isLiveWebcam !== undefined ? options.isLiveWebcam : true;
      const allowCardioBypass = options.allowCardioBypass !== undefined ? options.allowCardioBypass : false;

      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];
      const leftKnee = landmarks[config.LEFT_KNEE || 25];
      const rightKnee = landmarks[config.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[config.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[config.RIGHT_ANKLE || 28];

      // Require visibility. For plank allow side-view (one side) visibility; for other exercises require both sides for stability.
      const vis = (p) => p && (p.visibility == null || p.visibility > 0.5);
      if (exerciseMode === 'plank' || exerciseMode === 'reverseplank') {
        const leftSideOk = vis(leftShoulder) && vis(leftHip);
        const rightSideOk = vis(rightShoulder) && vis(rightHip);
        if (!leftSideOk && !rightSideOk) {
          // Not enough landmarks to evaluate plank reliably
          return {
            isValid: false,
            reason: 'insufficient_visibility',
            orientation: 'unknown',
            feedback: 'Position yourself so your body is fully visible to the camera'
          };
        }
      } else if (exerciseMode === 'pushups' || exerciseMode === 'widepushups' || exerciseMode === 'narrowpushups' || exerciseMode === 'diamondpushups' || exerciseMode === 'kneepushups') {
        // For push-ups (including wide and narrow variants) we only require both shoulders and hips to be visible.
        if (!vis(leftShoulder) || !vis(rightShoulder) || !vis(leftHip) || !vis(rightHip)) {
          return {
            isValid: false,
            reason: 'insufficient_visibility',
            orientation: 'unknown',
            feedback: 'Position yourself so your shoulders and hips are visible'
          };
        }
      } else {
        // For other exercises require knees visible for stability
        if (!vis(leftShoulder) || !vis(rightShoulder) || !vis(leftHip) || !vis(rightHip) || !vis(leftKnee) || !vis(rightKnee)) {
          return {
            isValid: false,
            reason: 'insufficient_visibility',
            orientation: 'unknown',
            feedback: 'Position yourself so your full body is visible'
          };
        }
      }

      // Calculate center points
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };

      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };

      const kneeCenter = {
        x: (leftKnee.x + rightKnee.x) / 2,
        y: (leftKnee.y + rightKnee.y) / 2
      };
      const ankleCenter = (vis(leftAnkle) && vis(rightAnkle)) ? {
        x: (leftAnkle.x + rightAnkle.x) / 2,
        y: (leftAnkle.y + rightAnkle.y) / 2
      } : null;

      // Compute torso axis (shoulder midpoint to hip midpoint vector)
      const torsoVector = {
        x: hipCenter.x - shoulderCenter.x,
        y: hipCenter.y - shoulderCenter.y
      };
      
      // Compute torso angle relative to horizontal (in degrees)
      const torsoAngle = Math.atan2(torsoVector.y, torsoVector.x) * (180 / Math.PI);
      
      // Classify orientation (horizontal vs vertical based on torso angle)
      // Horizontal: torso angle close to 0° or 180° (±45°)
      // Vertical: torso angle close to 90° or -90° (±45°)
      const absAngle = Math.abs(torsoAngle);
      let orientation;
      if (absAngle < 45 || absAngle > 135) {
        orientation = 'horizontal';
      } else {
        orientation = 'vertical';
      }

      // Vectors for straightness
      const targetPoint = ankleCenter || kneeCenter;
      const v1 = { x: shoulderCenter.x - hipCenter.x, y: shoulderCenter.y - hipCenter.y };
      const v2 = targetPoint ? { x: targetPoint.x - hipCenter.x, y: targetPoint.y - hipCenter.y } : null;

      // Determine if posture is good based on exercise-specific logic
      let isGoodPostureInstant = false;
      let feedbackMessage = null;
      let reason = null;
      
      if (exerciseMode === 'plank' || exerciseMode === 'reverseplank' || exerciseMode === 'sideplank' || 
          exerciseMode === 'straightarmplank' || exerciseMode === 'reversestraightarmplank' || exerciseMode === 'kneeplank') {
        // Plank: support both front-facing and side-view evaluation.
        const cfg = window.MediaPipeConfig?.PLANK_CONFIG || {};

        // Prefer side-view detection when one full side is visible (shoulder, hip, ankle)
        const leftSideVisible = vis(leftShoulder) && vis(leftHip) && vis(leftAnkle);
        const rightSideVisible = vis(rightShoulder) && vis(rightHip) && vis(rightAnkle);

        if (leftSideVisible || rightSideVisible) {
          const shoulder = leftSideVisible ? leftShoulder : rightShoulder;
          const hip = leftSideVisible ? leftHip : rightHip;
          const ankle = leftSideVisible ? leftAnkle : rightAnkle;

          // Angle at hip between shoulder-hip-ankle: near 180° for a straight plank
          const sideAngle = this.calculateAngle(shoulder, hip, ankle);
          const minSideAngle = cfg.MIN_SIDE_ANGLE ?? 155; // degrees

          isGoodPostureInstant = sideAngle >= minSideAngle;

          if (!isGoodPostureInstant) {
            feedbackMessage = 'Keep your body in a straight line';
            reason = 'body_not_straight';
          }

          // optional knee check when both ankles visible
          if (isGoodPostureInstant && ankleCenter) {
            const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
            const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
            const kneeMin = cfg.KNEE_MIN_DEG ?? 150;
            const kneeOk = (leftKneeAngle >= kneeMin) && (rightKneeAngle >= kneeMin);
            if (!kneeOk) {
              feedbackMessage = 'Keep your knees straight';
              reason = 'knees_bent';
            }
            isGoodPostureInstant = isGoodPostureInstant && kneeOk;
          }

        } else {
          // Fallback: use center-based straightness + orientation as before (front-facing)
          let cosSim = -1;
          if (v2) {
            const mag1 = Math.hypot(v1.x, v1.y) || 1;
            const mag2 = Math.hypot(v2.x, v2.y) || 1;
            cosSim = (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2);
          }
          const absCos = Math.abs(Math.max(-1, Math.min(1, cosSim)));
          const straightEnough = v2 ? (absCos >= (cfg.STRAIGHT_ABS_COS_MIN ?? 0.90)) : false;
          const dx = shoulderCenter.x - hipCenter.x;
          const dy = shoulderCenter.y - hipCenter.y;
          const orientDeg = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
          const horizMax = cfg.HORIZ_MAX_DEG ?? 35;
          const nearHorizontal = (orientDeg <= horizMax) || (orientDeg >= (180 - horizMax));
          let kneeOk = true;
          if (ankleCenter) {
            const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
            const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
            const kneeMin = cfg.KNEE_MIN_DEG ?? 150;
            kneeOk = (leftKneeAngle >= kneeMin) && (rightKneeAngle >= kneeMin);
          }
          isGoodPostureInstant = straightEnough && nearHorizontal && kneeOk;
          
          if (!straightEnough) {
            feedbackMessage = 'Keep your body in a straight line';
            reason = 'body_not_straight';
          } else if (!nearHorizontal) {
            feedbackMessage = 'Align your body horizontally';
            reason = 'body_not_horizontal';
          } else if (!kneeOk) {
            feedbackMessage = 'Keep your knees straight';
            reason = 'knees_bent';
          }
        }

      } else if (exerciseMode === 'squats') {
        // Squats: accept normal descent (hip moving below knee) as a valid posture.
        // Only flag 'BAD' when there's severe hip/back collapse (rounded back).
        const scfg = window.MediaPipeConfig?.SQUAT_CONFIG || {};
        const hipAngleLeft = this.calculateAngle(leftShoulder, leftHip, leftKnee);
        const hipAngleRight = this.calculateAngle(rightShoulder, rightHip, rightKnee);
        const hipAngle = (hipAngleLeft + hipAngleRight) / 2;
        // Configurable thresholds
        const hipAngleMin = scfg.HIP_ANGLE_MIN ?? 120; // generous minimum for 'upright' expectation
        const collapseThreshold = scfg.HIP_ANGLE_COLLAPSE ?? 60; // below this -> collapsed (bad)
        const dx = shoulderCenter.x - hipCenter.x;
        const dy = shoulderCenter.y - hipCenter.y;
        const torsoTiltDeg = Math.abs(Math.atan2(dx, -dy) * 180 / Math.PI);
        const tiltMax = scfg.TORSO_TILT_MAX ?? 60;

        // Determine hip vs knee vertical relationship (allow descent)
        const hipBelowKnee = kneeCenter && (hipCenter.y > kneeCenter.y);

        const collapseTiltMin = scfg.COLLAPSE_TILT_MIN ?? 70; // require significant forward rounding
        if (hipAngle < collapseThreshold && torsoTiltDeg > collapseTiltMin) {
          // Severe collapse (rounded back + low hip angle) — definitely bad
          isGoodPostureInstant = false;
          feedbackMessage = 'Keep your back straight - avoid rounding';
          reason = 'back_collapsed';
        } else if (hipBelowKnee) {
          // Normal squat descent — accept as good (as long as collapse not detected)
          isGoodPostureInstant = true;
        } else {
          // Standing/upright checks: require reasonable hip angle and torso tilt
          isGoodPostureInstant = (hipAngle >= hipAngleMin) && (torsoTiltDeg <= tiltMax);
          if (!isGoodPostureInstant) {
            if (hipAngle < hipAngleMin) {
              feedbackMessage = 'Keep your chest up';
              reason = 'hip_angle_low';
            } else {
              feedbackMessage = 'Avoid leaning too far forward';
              reason = 'excessive_forward_lean';
            }
          }
        }
      } else if (exerciseMode === 'jumpingjacks' || exerciseMode === 'highknees') {
        // Cardio exercises: more lenient posture requirements
        // Just check that body is generally upright (vertical orientation)
        isGoodPostureInstant = (orientation === 'vertical');
        if (!isGoodPostureInstant) {
          feedbackMessage = 'Stand upright';
          reason = 'not_upright';
        }
      } else {
        // Push-ups and other horizontal exercises: prefer a dedicated horizontal-body check.
        // Two modes: side view (ankles visible) -> use straight-line similarity as before.
        // Front/angled view (no ankle visibility) -> check shoulder-hip orientation close to horizontal
        const cfg = window.MediaPipeConfig?.PUSHUP_CONFIG || {};
        const SIDE_ABS_COS_MIN = cfg.SIDE_ABS_COS_MIN ?? 0.82; // slightly more lenient
        const HORIZ_TORSO_MAX_DEG = cfg.HORIZ_TORSO_MAX_DEG ?? 35; // allow more tilt

        // If ankle center available assume side/diagonal view and use cos similarity
        if (ankleCenter && v2) {
          let cosSim = -1;
          const mag1 = Math.hypot(v1.x, v1.y) || 1;
          const mag2 = Math.hypot(v2.x, v2.y) || 1;
          cosSim = (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2);
          const absCos = Math.abs(Math.max(-1, Math.min(1, cosSim)));
          isGoodPostureInstant = absCos >= SIDE_ABS_COS_MIN;
          if (!isGoodPostureInstant) {
            feedbackMessage = 'Keep your body in a straight line';
            reason = 'body_not_straight';
          }
        } else {
          // Fallback: check that shoulder-hip axis is near horizontal (small dy)
          const dx = shoulderCenter.x - hipCenter.x;
          const dy = shoulderCenter.y - hipCenter.y;
          const angDeg = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
          // angle near 0 or near 180 -> horizontal
          const nearHorizontal = (angDeg <= HORIZ_TORSO_MAX_DEG) || (angDeg >= (180 - HORIZ_TORSO_MAX_DEG));
          // Also ensure it's not standing (i.e., torso nearly vertical)
          const nearVertical = (angDeg >= 90 - 20 && angDeg <= 90 + 20);
          isGoodPostureInstant = nearHorizontal && !nearVertical;
          if (!isGoodPostureInstant) {
            if (nearVertical) {
              feedbackMessage = 'Get into push-up position';
              reason = 'standing_position';
            } else {
              feedbackMessage = 'Align your body horizontally';
              reason = 'body_not_horizontal';
            }
          }
        }
      }

      // Implement configurable hysteresis windows using frame counters
      const hysteresisConfig = window.MediaPipeConfig?.HYSTERESIS_CONFIG || {};
      const exerciseHysteresis = hysteresisConfig[exerciseMode] || { goodFrames: 3, badFrames: 5 };
      
      // Initialize hysteresis counters if not exists
      if (!this._postureGoodFrameCount) this._postureGoodFrameCount = 0;
      if (!this._postureBadFrameCount) this._postureBadFrameCount = 0;
      if (!this._postureState) this._postureState = 'unknown';
      
      // Update frame counters based on instant posture
      if (isGoodPostureInstant) {
        this._postureGoodFrameCount++;
        this._postureBadFrameCount = 0;
      } else {
        this._postureBadFrameCount++;
        this._postureGoodFrameCount = 0;
      }
      
      // Apply hysteresis: only change state after threshold frames
      let isValid = this._postureState === 'correct';
      if (this._postureGoodFrameCount >= exerciseHysteresis.goodFrames) {
        this._postureState = 'correct';
        isValid = true;
      } else if (this._postureBadFrameCount >= exerciseHysteresis.badFrames) {
        this._postureState = 'incorrect';
        isValid = false;
      }
      
      // Cardio bypass logic: allow rep counting for high-motion exercises even when posture temporarily fails
      const cardioExercises = ['jumpingjacks', 'highknees'];
      if (allowCardioBypass && cardioExercises.includes(exerciseMode)) {
        // For cardio, we still validate but don't block counting
        if (!isValid) {
          reason = reason || 'posture_warning';
          feedbackMessage = feedbackMessage || 'Try to maintain better form';
        }
        // Override isValid to allow counting
        isValid = true;
      }

      console.log(`🏃 Posture(${exerciseMode}): instant=${isGoodPostureInstant}, state=${this._postureState}, isValid=${isValid}, orientation=${orientation}`);

      // Return structured result object
      return {
        isValid,
        reason: reason || (isValid ? 'posture_correct' : 'posture_incorrect'),
        orientation,
        feedback: feedbackMessage || (isValid ? null : 'Adjust your posture')
      };
    } catch (error) {
      console.error('Error checking back alignment:', error);
      return false;
    }
  }

  // Update push-up counter
  updatePushupCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const pushupConfig = window.MediaPipeConfig?.PUSHUP_CONFIG || {};

      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const leftElbow = landmarks[config.LEFT_ELBOW || 13];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const rightElbow = landmarks[config.RIGHT_ELBOW || 14];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];

      if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist || !leftHip || !rightHip) {
        return;
      }

      // Calculate elbow angles
      const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
      const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

      // Average shoulder position (for height detection)
      const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;

      const downThreshold = pushupConfig.ELBOW_ANGLE_DOWN || 95;
      const upThreshold = pushupConfig.ELBOW_ANGLE_UP || 155;
      const shoulderHeightThreshold = pushupConfig.SHOULDER_HEIGHT_DOWN || 0.02;

      // Push-up position: elbows bent OR shoulders close to ground
      // Determine if user is likely standing: if shoulders are well above hips and torso vertical
      const shoulderHipDy = Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftHip.y + rightHip.y) / 2));
      const torsoVerticalThreshold = pushupConfig.TORSO_VERTICAL_DY ?? 0.15; // if shoulders far above hips (normalized units)
      const isLikelyStanding = shoulderHipDy < (pushupConfig.STANDING_DY_MIN ?? 0.05) ? false : ((leftShoulder.y + rightShoulder.y) / 2) < ((leftHip.y + rightHip.y) / 2) - (pushupConfig.STANDING_DY_MIN ?? 0.02);

      // Baseline shoulder level (approx when 'up' state) — store per-mode baseline
      const pstate = this.perModeState['pushups'];
      if (!pstate._baselineShoulderY) {
        // initialize baseline to current shoulder Y when pose roughly horizontal
        pstate._baselineShoulderY = avgShoulderY;
      }

      // If posture is not horizontal, don't update baseline; else slowly adapt baseline
      if (Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftHip.y + rightHip.y) / 2)) < 0.12) {
        // adapt baseline slowly
        pstate._baselineShoulderY = (pstate._baselineShoulderY * 0.95) + (avgShoulderY * 0.05);
      }

      // Push-up position: significant drop from baseline OR elbow angle threshold
      const shoulderDrop = avgShoulderY - (pstate._baselineShoulderY || avgShoulderY);
      const shoulderDropThreshold = pushupConfig.SHOULDER_DROP_THRESHOLD ?? 0.06; // normalized units
      const pushupPosition = (avgElbowAngle <= downThreshold) || (shoulderDrop >= shoulderDropThreshold) || (avgShoulderY >= (1 - shoulderHeightThreshold));

      // Standing position: elbows straight and shoulders high (not horizontal)
      const standingPosition = (avgElbowAngle >= upThreshold) && isLikelyStanding;

      // In-position gating: require user to assume a stable push-up start pose before starting counting
      if (!pstate._inPositionCount) pstate._inPositionCount = 0;
      const inStart = this.isPushupStartPose(landmarks);
      if (inStart) {
        pstate._inPositionCount += 1;
      } else {
        pstate._inPositionCount = 0;
      }

      const REQUIRED_STABLE_FRAMES = window.MediaPipeConfig?.PUSHUP_CONFIG?.START_STABLE_FRAMES ?? 6; // ~6 frames
      pstate._isInStartPose = pstate._inPositionCount >= REQUIRED_STABLE_FRAMES;

      // Debounce reps: minimum ms between consecutive counts
      const MIN_REP_MS = window.MediaPipeConfig?.PUSHUP_CONFIG?.MIN_REP_MS ?? 400;
      if (!pstate._lastRepAt) pstate._lastRepAt = 0;
      const now = Date.now();

      // Only count if posture is correct and user is in start pose
      if (this.postureStatus !== 'correct' || !pstate._isInStartPose) {
        return; // do not count
      }

      if (pstate.state === 'up') {
        if (pushupPosition && (now - pstate._lastRepAt) > MIN_REP_MS) {
          // Check for unrealistic cadence before counting
          const cadenceAnomaly = this._trackRepCadence(now);
          if (cadenceAnomaly) {
            // Emit telemetry for anomaly detection
            this._emitTelemetry({
              type: 'pose-anomaly-detected',
              timestamp: now,
              frameNumber: this._frameNumber,
              anomalyType: cadenceAnomaly.type,
              anomalyReason: cadenceAnomaly.reason,
              timeSinceLastRep: cadenceAnomaly.timeSinceLastRep,
              threshold: cadenceAnomaly.threshold,
              averageCadence: cadenceAnomaly.averageCadence,
              repTimings: cadenceAnomaly.repTimings
            });
            
            // Throttle rep counting for unrealistic cadence
            console.warn('⚠️ Unrealistic cadence detected, throttling rep count');
            return;
          }
          
          pstate.state = 'down';
          pstate.count += 1; // Count on descent
          pstate._lastRepAt = now;
          this.playSuccessSound(); // Play success sound
          if (this.onPushupCount) this.onPushupCount(pstate.count);
          if (this.onFormFeedback) {
            this.onFormFeedback({ message: `Push-up ${pstate.count}`, type: 'success', timestamp: now });
          }
        }
      } else if (pstate.state === 'down') {
        // return to up when standingPosition or full extension detected
        if (standingPosition || (!pushupPosition && avgElbowAngle >= upThreshold)) {
          pstate.state = 'up'; // Reset state for next rep
        }
      }
    } catch (error) {
      console.error('Error updating push-up counter:', error);
    }
  }

  // Narrow push-up counter: exact copy of push-up logic scoped to perModeState['narrowpushups']
  updateNarrowPushupCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const pushupConfig = window.MediaPipeConfig?.PUSHUP_CONFIG || {};
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const leftElbow = landmarks[config.LEFT_ELBOW || 13];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const rightElbow = landmarks[config.RIGHT_ELBOW || 14];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];

      if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist || !leftHip || !rightHip) {
        return;
      }

      // Calculate elbow angles
      const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
      const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

      // Average shoulder position (for height detection)
      const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;

      const downThreshold = pushupConfig.ELBOW_ANGLE_DOWN || 95;
      const upThreshold = pushupConfig.ELBOW_ANGLE_UP || 155;
      const shoulderHeightThreshold = pushupConfig.SHOULDER_HEIGHT_DOWN || 0.02;

      // Push-up position: elbows bent OR shoulders close to ground
      // Determine if user is likely standing: if shoulders are well above hips and torso vertical
      const shoulderHipDy = Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftHip.y + rightHip.y) / 2));
      const torsoVerticalThreshold = pushupConfig.TORSO_VERTICAL_DY ?? 0.15; // if shoulders far above hips (normalized units)
      const isLikelyStanding = shoulderHipDy < (pushupConfig.STANDING_DY_MIN ?? 0.05) ? false : ((leftShoulder.y + rightShoulder.y) / 2) < ((leftHip.y + rightHip.y) / 2) - (pushupConfig.STANDING_DY_MIN ?? 0.02);

      // Baseline shoulder level (approx when 'up' state) — store per-mode baseline
      const pstate = this.perModeState['narrowpushups'];
      if (!pstate._baselineShoulderY) {
        // initialize baseline to current shoulder Y when pose roughly horizontal
        pstate._baselineShoulderY = avgShoulderY;
      }

      // If posture is not horizontal, don't update baseline; else slowly adapt baseline
      if (Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftHip.y + rightHip.y) / 2)) < 0.12) {
        // adapt baseline slowly
        pstate._baselineShoulderY = (pstate._baselineShoulderY * 0.95) + (avgShoulderY * 0.05);
      }

      // Push-up position: significant drop from baseline OR elbow angle threshold
      const shoulderDrop = avgShoulderY - (pstate._baselineShoulderY || avgShoulderY);
      const shoulderDropThreshold = pushupConfig.SHOULDER_DROP_THRESHOLD ?? 0.06; // normalized units
      const pushupPosition = (avgElbowAngle <= downThreshold) || (shoulderDrop >= shoulderDropThreshold) || (avgShoulderY >= (1 - shoulderHeightThreshold));

      // Standing position: elbows straight and shoulders high (not horizontal)
      const standingPosition = (avgElbowAngle >= upThreshold) && isLikelyStanding;

      // In-position gating: require user to assume a stable push-up start pose before starting counting
      if (!pstate._inPositionCount) pstate._inPositionCount = 0;
      const inStart = this.isPushupStartPose(landmarks);
      if (inStart) {
        pstate._inPositionCount += 1;
      } else {
        pstate._inPositionCount = 0;
      }

      const REQUIRED_STABLE_FRAMES = window.MediaPipeConfig?.PUSHUP_CONFIG?.START_STABLE_FRAMES ?? 6; // ~6 frames
      pstate._isInStartPose = pstate._inPositionCount >= REQUIRED_STABLE_FRAMES;

      // Debounce reps: minimum ms between consecutive counts
      const MIN_REP_MS = window.MediaPipeConfig?.PUSHUP_CONFIG?.MIN_REP_MS ?? 400;
      if (!pstate._lastRepAt) pstate._lastRepAt = 0;
      const now = Date.now();

      // Only count if posture is correct and user is in start pose
      if (this.postureStatus !== 'correct' || !pstate._isInStartPose) {
        return; // do not count
      }

      if (pstate.state === 'up') {
        if (pushupPosition && (now - pstate._lastRepAt) > MIN_REP_MS) {
          pstate.state = 'down';
          pstate.count += 1; // Count on descent
          pstate._lastRepAt = now;
          this.playSuccessSound(); // Play success sound
          if (this.onPushupCount) this.onPushupCount(pstate.count);
          if (this.onFormFeedback) {
            this.onFormFeedback({ message: `Narrow Push-up ${pstate.count}`, type: 'success', timestamp: now });
          }
        }
      } else if (pstate.state === 'down') {
        // return to up when standingPosition or full extension detected
        if (standingPosition || (!pushupPosition && avgElbowAngle >= upThreshold)) {
          pstate.state = 'up'; // Reset state for next rep
        }
      }
    } catch (error) {
      console.error('Error updating narrow push-up counter:', error);
    }
  }

  // Diamond push-up counter: exact copy of push-up logic scoped to perModeState['diamondpushups']
  updateDiamondPushupCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const pushupConfig = window.MediaPipeConfig?.PUSHUP_CONFIG || {};
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const leftElbow = landmarks[config.LEFT_ELBOW || 13];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const rightElbow = landmarks[config.RIGHT_ELBOW || 14];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];

      if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist || !leftHip || !rightHip) {
        return;
      }

      // Calculate elbow angles
      const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
      const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

      // Average shoulder position (for height detection)
      const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;

      const downThreshold = pushupConfig.ELBOW_ANGLE_DOWN || 95;
      const upThreshold = pushupConfig.ELBOW_ANGLE_UP || 155;
      const shoulderHeightThreshold = pushupConfig.SHOULDER_HEIGHT_DOWN || 0.02;

      // Push-up position: elbows bent OR shoulders close to ground
      // Determine if user is likely standing: if shoulders are well above hips and torso vertical
      const shoulderHipDy = Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftHip.y + rightHip.y) / 2));
      const torsoVerticalThreshold = pushupConfig.TORSO_VERTICAL_DY ?? 0.15; // if shoulders far above hips (normalized units)
      const isLikelyStanding = shoulderHipDy < (pushupConfig.STANDING_DY_MIN ?? 0.05) ? false : ((leftShoulder.y + rightShoulder.y) / 2) < ((leftHip.y + rightHip.y) / 2) - (pushupConfig.STANDING_DY_MIN ?? 0.02);

      // Baseline shoulder level (approx when 'up' state) — store per-mode baseline
      const pstate = this.perModeState['diamondpushups'];
      if (!pstate._baselineShoulderY) {
        // initialize baseline to current shoulder Y when pose roughly horizontal
        pstate._baselineShoulderY = avgShoulderY;
      }

      // If posture is not horizontal, don't update baseline; else slowly adapt baseline
      if (Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftHip.y + rightHip.y) / 2)) < 0.12) {
        // adapt baseline slowly
        pstate._baselineShoulderY = (pstate._baselineShoulderY * 0.95) + (avgShoulderY * 0.05);
      }

      // Push-up position: significant drop from baseline OR elbow angle threshold
      const shoulderDrop = avgShoulderY - (pstate._baselineShoulderY || avgShoulderY);
      const shoulderDropThreshold = pushupConfig.SHOULDER_DROP_THRESHOLD ?? 0.06; // normalized units
      const pushupPosition = (avgElbowAngle <= downThreshold) || (shoulderDrop >= shoulderDropThreshold) || (avgShoulderY >= (1 - shoulderHeightThreshold));

      // Standing position: elbows straight and shoulders high (not horizontal)
      const standingPosition = (avgElbowAngle >= upThreshold) && isLikelyStanding;

      // In-position gating: require user to assume a stable push-up start pose before starting counting
      if (!pstate._inPositionCount) pstate._inPositionCount = 0;
      const inStart = this.isPushupStartPose(landmarks);
      if (inStart) {
        pstate._inPositionCount += 1;
      } else {
        pstate._inPositionCount = 0;
      }

      const REQUIRED_STABLE_FRAMES = window.MediaPipeConfig?.PUSHUP_CONFIG?.START_STABLE_FRAMES ?? 6; // ~6 frames
      pstate._isInStartPose = pstate._inPositionCount >= REQUIRED_STABLE_FRAMES;

      // Debounce reps: minimum ms between consecutive counts
      const MIN_REP_MS = window.MediaPipeConfig?.PUSHUP_CONFIG?.MIN_REP_MS ?? 400;
      if (!pstate._lastRepAt) pstate._lastRepAt = 0;
      const now = Date.now();

      // Only count if posture is correct and user is in start pose
      if (this.postureStatus !== 'correct' || !pstate._isInStartPose) {
        return; // do not count
      }

      if (pstate.state === 'up') {
        if (pushupPosition && (now - pstate._lastRepAt) > MIN_REP_MS) {
          pstate.state = 'down';
          pstate.count += 1; // Count on descent
          pstate._lastRepAt = now;
          this.playSuccessSound(); // Play success sound
          if (this.onPushupCount) this.onPushupCount(pstate.count);
          if (this.onFormFeedback) {
            this.onFormFeedback({ message: `Diamond Push-up ${pstate.count}`, type: 'success', timestamp: now });
          }
        }
      } else if (pstate.state === 'down') {
        // return to up when standingPosition or full extension detected
        if (standingPosition || (!pushupPosition && avgElbowAngle >= upThreshold)) {
          pstate.state = 'up'; // Reset state for next rep
        }
      }
    } catch (error) {
      console.error('Error updating diamond push-up counter:', error);
    }
  }

  // Update squat counter
  /**
   * Update squat counter with localization and tuning
   * Enhanced with bilateral depth validation, EMA smoothing, and differentiated feedback
   * Based on Python reference implementation from Fitness_Tracker_ui.py
   */
  updateSquatCounter(landmarks) {
    try {
      const cfg = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const scfg = window.MediaPipeConfig?.SQUAT_CONFIG || {};

      const leftHip = landmarks[cfg.LEFT_HIP || 23];
      const rightHip = landmarks[cfg.RIGHT_HIP || 24];
      const leftKnee = landmarks[cfg.LEFT_KNEE || 25];
      const rightKnee = landmarks[cfg.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[cfg.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[cfg.RIGHT_ANKLE || 28];
      const leftShoulder = landmarks[cfg.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[cfg.RIGHT_SHOULDER || 12];

      if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle || !leftShoulder || !rightShoulder) return;

      // Get state object and initialize RepTracker if needed
      const stateObj = this.perModeState['squats'];
      if (!stateObj._tracker) {
        // Create RepTracker with updated config matching Python reference
        stateObj._tracker = new RepTracker({
          minRepMs: scfg.MIN_REP_MS || 550,  // Updated from Python: MIN_REP_MS of 550ms
          emaAlpha: 0.25,  // Updated from Python: torso velocity smoothing alpha
          cooldownMs: 200,
          stateTransitions: {
            'up': ['down'],
            'down': ['up']
          },
          debugMode: false
        });
      }

      // Initialize EMA storage for torso velocity if not exists
      if (!stateObj._emaVelocity) stateObj._emaVelocity = 0;
      if (!stateObj._lastHipY) stateObj._lastHipY = null;
      if (!stateObj._lastRepAt) stateObj._lastRepAt = 0;

      // Check if user is in horizontal position (like pushup) - show warning but DO NOT count if so
      const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
      const hipCenterY = (leftHip.y + rightHip.y) / 2;
      const head = landmarks[cfg.NOSE || 0];
      const torsoDy = Math.abs(shoulderCenterY - hipCenterY);
      const HORIZONTAL_THRESHOLD = 0.08; // Same threshold as pushup detection
      // Check if head is at same y level as hips (head down, body horizontal)
      const headHipDy = Math.abs((head?.y ?? 0) - hipCenterY);
      const HEAD_HIP_HORIZONTAL_THRESHOLD = 0.10; // If head and hip are close in y, likely horizontal
      let isHorizontalLikePushup = false;
      if (torsoDy <= HORIZONTAL_THRESHOLD && headHipDy <= HEAD_HIP_HORIZONTAL_THRESHOLD) {
        isHorizontalLikePushup = true;
        // Use localized feedback key instead of hardcoded Arabic
        if (this.onFormFeedback) {
          this.onFormFeedback({
            message: 'feedback.squat.horizontalPosition',  // Localization key
            type: 'warning',
            timestamp: Date.now()
          });
        }
      }

      // Check if hands are on the ground (like pushup)
      const leftWrist = landmarks[cfg.LEFT_WRIST || 15];
      const rightWrist = landmarks[cfg.RIGHT_WRIST || 16];
      const leftFoot = landmarks[cfg.LEFT_ANKLE || 27];
      const rightFoot = landmarks[cfg.RIGHT_ANKLE || 28];
      // Consider hands on ground if both wrists are at or below the level of the ankles (with small margin)
      const HANDS_ON_GROUND_THRESHOLD = 0.07; // allow small margin
      let handsOnGround = false;
      if (leftWrist && rightWrist && leftFoot && rightFoot) {
        const avgWristY = (leftWrist.y + rightWrist.y) / 2;
        const avgFootY = (leftFoot.y + rightFoot.y) / 2;
        if (avgWristY >= avgFootY - HANDS_ON_GROUND_THRESHOLD) {
          handsOnGround = true;
          // Use localized feedback key instead of hardcoded Arabic
          if (this.onFormFeedback) {
            this.onFormFeedback({
              message: 'feedback.squat.handsOnGround',  // Localization key
              type: 'warning',
              timestamp: Date.now()
            });
          }
        }
      }

      // Average sides for stability
      const hip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
      const knee = { x: (leftKnee.x + rightKnee.x) / 2, y: (leftKnee.y + rightKnee.y) / 2 };
      const shoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };

      // Simplified thresholds
      const MIN_REP_MS = scfg.MIN_REP_MS || 450;
      const HIP_KNEE_THRESHOLD = scfg.HIP_BELOW_KNEE_MIN || 0.01; // Minimal threshold for hip exceeding knee

      // Calculate torso verticality (shoulder to hip angle relative to vertical)
      const dx = shoulder.x - hip.x;
      const dy = shoulder.y - hip.y;
      const torsoAngleDeg = Math.abs(Math.atan2(dx, -dy) * 180 / Math.PI);
      
      // Torso is vertical when angle is close to 0 (straight up)
      const TORSO_VERTICAL_THRESHOLD = scfg.TORSO_VERTICAL_THRESHOLD || 25; // degrees from vertical
      const isTorsoVertical = torsoAngleDeg <= TORSO_VERTICAL_THRESHOLD;

      // Simple hip position check: hip Y exceeds knee Y = squatting down
      const hipY = hip.y;
      const kneeY = knee.y;
      const hipExceedsKnee = (hipY - kneeY) > HIP_KNEE_THRESHOLD; // Hip below knee (Y increases downward)
      const hipBackAtKnee = (hipY - kneeY) <= HIP_KNEE_THRESHOLD; // Hip back at or above knee level

      // Debug logging
      console.log('🔍 Simplified Squat Logic:', {
        hipY: hipY.toFixed(3),
        kneeY: kneeY.toFixed(3),
        hipExceedsKnee,
        hipBackAtKnee,
        torsoAngleDeg: torsoAngleDeg.toFixed(1),
        isTorsoVertical,
        state: stateObj.state,
        count: stateObj.count
      });

      const now = Date.now();

      if (stateObj.state === 'up') {
        // Transition to 'down' state when hip exceeds knee position
        if (hipExceedsKnee && !isHorizontalLikePushup && !handsOnGround) {
          stateObj.state = 'down';
          console.log('⬇️ Squat state: UP → DOWN (hip exceeded knee)');
        }
      } else if (stateObj.state === 'down') {
        // Transition back to 'up' when hip comes back to knee level
        // Count rep ONLY when torso is vertical (standing position)
        if (hipBackAtKnee && (now - stateObj._lastRepAt) > MIN_REP_MS) {
          stateObj.state = 'up';
          
          // Count rep only if torso is vertical (user is standing)
          if (isTorsoVertical) {
            // Check for unrealistic cadence before counting
            const cadenceAnomaly = this._trackRepCadence(now);
            if (cadenceAnomaly) {
              // Emit telemetry for anomaly detection
              this._emitTelemetry({
                type: 'pose-anomaly-detected',
                timestamp: now,
                frameNumber: this._frameNumber,
                anomalyType: cadenceAnomaly.type,
                anomalyReason: cadenceAnomaly.reason,
                timeSinceLastRep: cadenceAnomaly.timeSinceLastRep,
                threshold: cadenceAnomaly.threshold,
                averageCadence: cadenceAnomaly.averageCadence,
                repTimings: cadenceAnomaly.repTimings
              });
              
              console.warn('⚠️ Unrealistic cadence detected, throttling rep count');
              return;
            }

            // Rep completed with vertical torso! Count it
            stateObj.count += 1;
            stateObj._lastRepAt = now;
            console.log('🎯 Squat rep counted! Torso vertical, count:', stateObj.count);
            this.playSuccessSound();
            if (this.onPushupCount) this.onPushupCount(stateObj.count);
            
            if (this.onFormFeedback) {
              this.onFormFeedback({
                message: `feedback.squat.repCounted`,
                type: 'success',
                timestamp: now,
                count: stateObj.count
              });
            }
          } else {
            console.log('⬆️ Squat state: DOWN → UP (hip back at knee, but torso not vertical - no count)');
          }
        } else if (hipBackAtKnee) {
          // Transition back to up but don't count (too soon since last rep)
          stateObj.state = 'up';
          console.log('⬆️ Squat state: DOWN → UP (too soon to count)');
        }
      }
    } catch (error) {
      console.error('Error updating squat counter:', error);
    }
  }

  // Update lunges counter
  updateLungesCounter(landmarks) {
    try {
      const cfg = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const lcfg = window.MediaPipeConfig?.LUNGES_CONFIG || {};
      const leftHip = landmarks[cfg.LEFT_HIP || 23];
      const rightHip = landmarks[cfg.RIGHT_HIP || 24];
      const leftKnee = landmarks[cfg.LEFT_KNEE || 25];
      const rightKnee = landmarks[cfg.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[cfg.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[cfg.RIGHT_ANKLE || 28];
      if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return;

      // Check if hands are on the ground (like pushup) - don't count lunges if hands on ground
      const leftWrist = landmarks[cfg.LEFT_WRIST || 15];
      const rightWrist = landmarks[cfg.RIGHT_WRIST || 16];
      const leftFoot = landmarks[cfg.LEFT_ANKLE || 27];
      const rightFoot = landmarks[cfg.RIGHT_ANKLE || 28];
      const HANDS_ON_GROUND_THRESHOLD = 0.07;
      let handsOnGround = false;
      if (leftWrist && rightWrist && leftFoot && rightFoot) {
        const avgWristY = (leftWrist.y + rightWrist.y) / 2;
        const avgFootY = (leftFoot.y + rightFoot.y) / 2;
        if (avgWristY >= avgFootY - HANDS_ON_GROUND_THRESHOLD) {
          handsOnGround = true;
        }
      }

      // Average hip position
      const hip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
      // Calculate knee angles
      const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
      const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
      // Determine which leg is front (more bent knee) - allow both legs to be counted
      const leftKneeBent = leftKneeAngle < rightKneeAngle;
      const frontKnee = leftKneeBent ? leftKnee : rightKnee;
      const backKnee = leftKneeBent ? rightKnee : leftKnee;
      const frontKneeAngle = leftKneeBent ? leftKneeAngle : rightKneeAngle;
      const backKneeAngle = leftKneeBent ? rightKneeAngle : leftKneeAngle;

      // Also check the opposite leg position (for alternating lunges)
      const rightKneeBent = rightKneeAngle < leftKneeAngle;
      const altFrontKnee = rightKneeBent ? rightKnee : leftKnee;
      const altBackKnee = rightKneeBent ? leftKnee : rightKnee;
      const altFrontKneeAngle = rightKneeBent ? rightKneeAngle : leftKneeAngle;
      const altBackKneeAngle = rightKneeBent ? leftKneeAngle : rightKneeAngle;
      // Hip position relative to front knee
      const hipBelowFrontKnee = hip.y > frontKnee.y;
      // Lunge position based on the image: one leg forward, body leaning forward, back knee close to ground
      const KNEE_Y_DIFF_THRESHOLD = 0.06; // فرق واضح بين الركبتين (رجل للأمام) - توسيع
      const BACK_KNEE_ANGLE_THRESHOLD = 120; // back knee bent (close to ground) - توسيع
      const FRONT_KNEE_ANGLE_THRESHOLD = 100; // front knee bent (stable support) - توسيع
      const HIP_FORWARD_THRESHOLD = 0.08; // hip leaning forward over front leg - توسيع

      const kneeYDiff = Math.abs(leftKnee.y - rightKnee.y);
      const oneLegForward = kneeYDiff > KNEE_Y_DIFF_THRESHOLD;

      // Check first leg position (left leg forward)
      const backKneeBent = backKneeAngle < BACK_KNEE_ANGLE_THRESHOLD;
      const frontKneeBent = frontKneeAngle < FRONT_KNEE_ANGLE_THRESHOLD;
      const frontHip = leftKneeBent ? leftHip : rightHip;
      const frontAnkle = leftKneeBent ? leftAnkle : rightAnkle;
      const hipForwardLean = Math.abs(frontHip.x - frontAnkle.x) < HIP_FORWARD_THRESHOLD;
      const lungePosition1 = oneLegForward && backKneeBent && frontKneeBent && hipForwardLean;

      // Check second leg position (right leg forward)
      const altBackKneeBent = altBackKneeAngle < BACK_KNEE_ANGLE_THRESHOLD;
      const altFrontKneeBent = altFrontKneeAngle < FRONT_KNEE_ANGLE_THRESHOLD;
      const altFrontHip = rightKneeBent ? rightHip : leftHip;
      const altFrontAnkle = rightKneeBent ? rightAnkle : leftAnkle;
      const altHipForwardLean = Math.abs(altFrontHip.x - altFrontAnkle.x) < HIP_FORWARD_THRESHOLD;
      const lungePosition2 = oneLegForward && altBackKneeBent && altFrontKneeBent && altHipForwardLean;

      // Either leg position counts as a lunge
      const lungePosition = lungePosition1 || lungePosition2;
      // Standing position: both knees straight
      const standingPosition = (frontKneeAngle >= 160) && (backKneeAngle >= 150);
      // Simple counting: count immediately when going down (like squats)
      const lstate = this.perModeState['lunges'];
      if (lstate.state === 'up') {
        if (!handsOnGround && lungePosition) {
          lstate.state = 'down';
          lstate.count += 1; // Count immediately on descent
          this.playSuccessSound(); // Play success sound
          if (this.onPushupCount) this.onPushupCount(lstate.count);
          if (this.onFormFeedback) {
            this.onFormFeedback({ message: `Lunge ${lstate.count}`, type: 'success', timestamp: Date.now() });
          }
        }
      } else if (lstate.state === 'down') {
        if (standingPosition) {
          lstate.state = 'up'; // Reset state for next rep
        }
      }
    } catch (error) {
      console.error('Error updating lunges counter:', error);
    }
  }

  // Add Burpees counter
  // Update mountain climbers counter


  // Update sit-ups counter (using squat-like logic as requested)
  updateSitUpsCounter(landmarks) {
    try {
      const cfg = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const scfg = window.MediaPipeConfig?.SQUAT_CONFIG || {};

      const leftHip = landmarks[cfg.LEFT_HIP || 23];
      const rightHip = landmarks[cfg.RIGHT_HIP || 24];
      const leftKnee = landmarks[cfg.LEFT_KNEE || 25];
      const rightKnee = landmarks[cfg.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[cfg.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[cfg.RIGHT_ANKLE || 28];
      const leftShoulder = landmarks[cfg.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[cfg.RIGHT_SHOULDER || 12];

      if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle || !leftShoulder || !rightShoulder) return;

      // Check if user is in horizontal position (like pushup) - show warning but DO NOT count if so
      const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
      const hipCenterY = (leftHip.y + rightHip.y) / 2;
      const head = landmarks[cfg.NOSE || 0];
      const torsoDy = Math.abs(shoulderCenterY - hipCenterY);
      const HORIZONTAL_THRESHOLD = 0.08; // Same threshold as pushup detection
      // Check if head is at same y level as hips (head down, body horizontal)
      const headHipDy = Math.abs((head?.y ?? 0) - hipCenterY);
      const HEAD_HIP_HORIZONTAL_THRESHOLD = 0.10; // If head and hip are close in y, likely horizontal
      let isHorizontalLikePushup = false;
      if (torsoDy <= HORIZONTAL_THRESHOLD && headHipDy <= HEAD_HIP_HORIZONTAL_THRESHOLD) {
        isHorizontalLikePushup = true;
        // Optional: show warning
        if (this.onFormFeedback) {
          this.onFormFeedback({
            message: 'وضع الجسم أفقي، لن يتم العد إلا في وضع الاسكوات الصحيح',
            type: 'warning',
            timestamp: Date.now()
          });
        }
      }

      // Check if hands are on the ground (like pushup)
      const leftWrist = landmarks[cfg.LEFT_WRIST || 15];
      const rightWrist = landmarks[cfg.RIGHT_WRIST || 16];
      const leftFoot = landmarks[cfg.LEFT_ANKLE || 27];
      const rightFoot = landmarks[cfg.RIGHT_ANKLE || 28];
      // Consider hands on ground if both wrists are at or below the level of the ankles (with small margin)
      const HANDS_ON_GROUND_THRESHOLD = 0.07; // allow small margin
      let handsOnGround = false;
      if (leftWrist && rightWrist && leftFoot && rightFoot) {
        const avgWristY = (leftWrist.y + rightWrist.y) / 2;
        const avgFootY = (leftFoot.y + rightFoot.y) / 2;
        if (avgWristY >= avgFootY - HANDS_ON_GROUND_THRESHOLD) {
          handsOnGround = true;
          if (this.onFormFeedback) {
            this.onFormFeedback({
              message: 'اليدين على الأرض، لن يتم العد إلا في وضع الاسكوات الصحيح',
              type: 'warning',
              timestamp: Date.now()
            });
          }
        }
      }

      // Average sides for stability
      const hip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
      const knee = { x: (leftKnee.x + rightKnee.x) / 2, y: (leftKnee.y + rightKnee.y) / 2 };
      const ankle = { x: (leftAnkle.x + rightAnkle.x) / 2, y: (leftAnkle.y + rightAnkle.y) / 2 };
      const shoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };

      // Knee angle using hip-knee-ankle
      const kneeAngleLeft = this.calculateAngle(leftHip, leftKnee, leftAnkle);
      const kneeAngleRight = this.calculateAngle(rightHip, rightKnee, rightAnkle);
      const avgKneeAngle = (kneeAngleLeft + kneeAngleRight) / 2;

      // Check leg stability - both legs should be moving together (not one leg down)
      const leftKneeY = leftKnee.y;
      const rightKneeY = rightKnee.y;
      const kneeHeightDiff = Math.abs(leftKneeY - rightKneeY);
      const LEG_STABILITY_THRESHOLD = 0.05; // Maximum difference between left and right knee heights

      const legsStable = kneeHeightDiff <= LEG_STABILITY_THRESHOLD;

      // Check if knees are bending (squatting down)
      const kneesBending = avgKneeAngle < 120; // Knees bent when angle is less than 120 degrees

      // Count based on hip position (lower back points)
      const hipY = hip.y; // Y position of hips (lower = deeper)
      const kneeY = knee.y; // Y position of knees

      // Hip goes below knee level = deep squat
      const hipBelowKnee = hipY > kneeY;
      // Hip goes back up above knee level = standing
      const hipAboveKnee = hipY < kneeY;

      // State machine: count when hip goes down below knee level (use per-mode state)
      const stateObj = this.perModeState['situps'];

      // Debug logging
      console.log('🔍 Situp Debug:', {
        legsStable,
        kneesBending,
        avgKneeAngle,
        kneeHeightDiff,
        hipBelowKnee,
        hipAboveKnee,
        state: stateObj && stateObj.state,
        count: stateObj && stateObj.count
      });

      // Simplified squat-style counting: count when hips go below knees with stable legs
      const MIN_REP_MS = window.MediaPipeConfig?.SQUAT_CONFIG?.MIN_REP_MS ?? 500;
      if (!stateObj._lastRepAt) stateObj._lastRepAt = 0;
      const now = Date.now();

      if (stateObj.state === 'up') {
        // Count if hips go below knees and legs are stable, and NOT in horizontal position or hands on ground
        if (hipBelowKnee && legsStable && !isHorizontalLikePushup && !handsOnGround && (now - stateObj._lastRepAt) > MIN_REP_MS) {
          stateObj.state = 'down';
          stateObj.count += 1;
          stateObj._lastRepAt = now;
          console.log('🎯 Sit-up counted! Count:', stateObj.count);
          this.playSuccessSound(); // Play success sound
          if (this.onPushupCount) this.onPushupCount(stateObj.count);
        } else {
          // Debug why counting didn't happen
          if (!hipBelowKnee) {
            console.log('❌ Not counting: Hips not below knees');
          } else if (!legsStable) {
            console.log('❌ Not counting: Legs not stable (one leg down)');
          } else if (isHorizontalLikePushup) {
            console.log('❌ Not counting: Body is horizontal like pushup');
          } else if (handsOnGround) {
            console.log('❌ Not counting: Hands are on the ground');
          } else if ((now - stateObj._lastRepAt) <= MIN_REP_MS) {
            console.log('❌ Not counting: Too soon since last rep');
          }
        }
      } else if (stateObj.state === 'down') {
        if (hipAboveKnee) {
          stateObj.state = 'up';
          console.log('⬆️ Sit-up state changed to UP');
        }
      }
    } catch (error) {
      console.error('Error updating situps counter (squat copy):', error);
    }
  }

  // Update wall sit counter - measures hold time with proper form validation
  updateWallSitCounter(landmarks) {
    console.log('🪑 updateWallSitCounter called!');
    try {
      const cfg = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const wallsitCfg = window.MediaPipeConfig?.WALLSIT_CONFIG || {};
      const now = Date.now();

      // Extract required landmarks
      const ls = landmarks[cfg.LEFT_SHOULDER || 11];
      const rs = landmarks[cfg.RIGHT_SHOULDER || 12];
      const lh = landmarks[cfg.LEFT_HIP || 23];
      const rh = landmarks[cfg.RIGHT_HIP || 24];
      const lk = landmarks[cfg.LEFT_KNEE || 25];
      const rk = landmarks[cfg.RIGHT_KNEE || 26];
      const la = landmarks[cfg.LEFT_ANKLE || 27];
      const ra = landmarks[cfg.RIGHT_ANKLE || 28];

      // Get state object
      const state = this.perModeState['wallsit'];
      if (!state) {
        console.error('❌ Wall sit state object not initialized');
        return;
      }

      // Initialize state properties
      if (state.goodFrames === undefined) state.goodFrames = 0;
      if (state.badFrames === undefined) state.badFrames = 0;
      if (state.inHold === undefined) state.inHold = false;
      if (state.holdStartMs === undefined) state.holdStartMs = 0;
      if (state.totalHoldMs === undefined) state.totalHoldMs = 0;
      if (state.lastWarningMs === undefined) state.lastWarningMs = 0;

      // 1. Visibility gate
      const minVis = wallsitCfg.MIN_VISIBILITY || 0.35;
      const indices = [
        cfg.LEFT_SHOULDER, cfg.RIGHT_SHOULDER,
        cfg.LEFT_HIP, cfg.RIGHT_HIP,
        cfg.LEFT_KNEE, cfg.RIGHT_KNEE,
        cfg.LEFT_ANKLE, cfg.RIGHT_ANKLE
      ];

      if (indices.some(i => !landmarks[i] || landmarks[i].visibility < minVis)) {
        console.log('❌ Wall sit: Landmarks occluded or missing');
        this._pauseWallSitHold(state, now, 'Landmarks occluded');
        return;
      }

      console.log('✅ Wall sit: All landmarks present');

      // 2. Calculate joint angles using 3D-aware method
      const leftKneeAngle = this.calculateAngle3D(lh, lk, la);
      const rightKneeAngle = this.calculateAngle3D(rh, rk, ra);
      const leftHipAngle = this.calculateAngle3D(ls, lh, lk);
      const rightHipAngle = this.calculateAngle3D(rs, rh, rk);

      // 3. Alignment checks
      const shoulderMid = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
      const hipMid = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
      
      const wallAlignment = Math.abs(shoulderMid.x - hipMid.x);
      const torsoVec = { x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y };
      const torsoTiltDeg = Math.abs(Math.atan2(torsoVec.x, torsoVec.y) * 180 / Math.PI);

      // 4. Form validation with lenient thresholds for multi-angle support
      const issues = [];

      // Check knee angles (80-100° target, but accept 60-130° for different angles)
      const kneeMin = wallsitCfg.KNEE_ANGLE_MIN || 60;
      const kneeMax = wallsitCfg.KNEE_ANGLE_MAX || 130;
      if (!(leftKneeAngle >= kneeMin && leftKneeAngle <= kneeMax &&
            rightKneeAngle >= kneeMin && rightKneeAngle <= kneeMax)) {
        issues.push("Sink to 90° knees");
      }

      // Check knee symmetry
      const kneeDiffMax = wallsitCfg.KNEE_ANGLE_DIFF_MAX || 30;
      if (Math.abs(leftKneeAngle - rightKneeAngle) > kneeDiffMax) {
        issues.push("Even out both legs");
      }

      // Check hip angles (80-110° target, but accept 60-130° for different angles)
      const hipMin = wallsitCfg.HIP_ANGLE_MIN || 60;
      const hipMax = wallsitCfg.HIP_ANGLE_MAX || 130;
      if (!(leftHipAngle >= hipMin && leftHipAngle <= hipMax &&
            rightHipAngle >= hipMin && rightHipAngle <= hipMax)) {
        issues.push("Keep torso upright");
      }

      // Check wall alignment (more lenient for different camera angles)
      const wallMax = wallsitCfg.WALL_ALIGNMENT_MAX || 0.15;
      if (wallAlignment > wallMax) {
        issues.push("Press back into wall");
      }

      // Check torso tilt (more lenient for different camera angles)
      const tiltMax = wallsitCfg.TORSO_TILT_MAX || 30;
      if (torsoTiltDeg > tiltMax) {
        issues.push("Stay vertical");
      }

      const allGood = issues.length === 0;

      // Debug logging
      console.log('🪑 Wall Sit Debug:', {
        leftKneeAngle: leftKneeAngle?.toFixed(1) || 'N/A',
        rightKneeAngle: rightKneeAngle?.toFixed(1) || 'N/A',
        leftHipAngle: leftHipAngle?.toFixed(1) || 'N/A',
        rightHipAngle: rightHipAngle?.toFixed(1) || 'N/A',
        wallAlignment: wallAlignment.toFixed(3),
        torsoTiltDeg: torsoTiltDeg.toFixed(1),
        allGood,
        issues: issues.join(', '),
        goodFrames: state.goodFrames,
        badFrames: state.badFrames,
        inHold: state.inHold,
        totalSeconds: (state.totalHoldMs / 1000).toFixed(1)
      });

      // 4. Hysteresis-driven state machine
      const hystGood = wallsitCfg.HYSTERESIS_GOOD || 1; // More responsive for multi-angle
      const hystBad = wallsitCfg.HYSTERESIS_BAD || 3;   // More responsive for multi-angle

      if (allGood) {
        state.goodFrames++;
        state.badFrames = 0;
        if (state.goodFrames >= hystGood) {
          this._startWallSitHold(state, now);
        }
      } else {
        state.badFrames++;
        state.goodFrames = 0;
        if (state.badFrames >= hystBad) {
          this._pauseWallSitHold(state, now, issues[0] || 'Fix posture');
        }
      }

      // 5. Update count and UI
      if (state.inHold) {
        const currentHoldMs = now - state.holdStartMs;
        const totalSeconds = Math.floor((state.totalHoldMs + currentHoldMs) / 1000);
        state.count = totalSeconds;
        
        console.log(`🪑⏱️ Wall sit: Holding... ${totalSeconds} seconds (${cameraAngle} view)`);
        
        if (this.onTimeUpdate) {
          this.onTimeUpdate(totalSeconds);
          console.log(`🪑📢 Wall sit: Called onTimeUpdate with ${totalSeconds} seconds`);
        } else {
          console.warn('🪑⚠️ Wall sit: onTimeUpdate callback not set!');
        }
      } else {
        // Not holding, just show accumulated time
        const totalSeconds = Math.floor(state.totalHoldMs / 1000);
        state.count = totalSeconds;
      }

    } catch (error) {
      console.error('Error updating wall sit counter:', error);
    }
  }

  _startWallSitHold(state, timestamp) {
    const cfg = window.MediaPipeConfig?.WALLSIT_CONFIG || {};
    if (!state.inHold && cfg.ENABLE_HOLD_TIMER) {
      state.inHold = true;
      state.holdStartMs = timestamp;
      console.log('🪑✅ Wall sit: Started holding position! Timer starting...');
    }
  }

  _pauseWallSitHold(state, timestamp, reason) {
    if (state.inHold) {
      state.inHold = false;
      state.totalHoldMs += timestamp - state.holdStartMs;
      state.holdStartMs = 0;
      console.log(`🪑⏸️ Wall sit: Paused holding - ${reason}. Total: ${(state.totalHoldMs / 1000).toFixed(1)}s`);
    }

    const cfg = window.MediaPipeConfig?.WALLSIT_CONFIG || {};
    if (timestamp - state.lastWarningMs > (cfg.WARNING_COOLDOWN || 2000)) {
      state.lastWarningMs = timestamp;
      if (this.onFormFeedback) {
        this.onFormFeedback({
          message: reason,
          type: 'warning',
          timestamp: timestamp
        });
      }
    }
  }

  /**
   * Calculate 3D angle between three points (handles z-coordinate)
   * @param {Object} a - First point {x, y, z?, visibility}
   * @param {Object} b - Middle point (vertex) {x, y, z?, visibility}
   * @param {Object} c - Third point {x, y, z?, visibility}
   * @returns {number|null} - Angle in degrees or null if calculation fails
   */
  calculateAngle3D(a, b, c) {
    if (!a || !b || !c) return null;
    
    try {
      const ba = {
        x: a.x - b.x,
        y: a.y - b.y,
        z: (a.z ?? 0) - (b.z ?? 0)
      };
      const bc = {
        x: c.x - b.x,
        y: c.y - b.y,
        z: (c.z ?? 0) - (b.z ?? 0)
      };

      const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
      const magBA = Math.hypot(ba.x, ba.y, ba.z);
      const magBC = Math.hypot(bc.x, bc.y, bc.z);

      if (magBA === 0 || magBC === 0) return null;

      const cosAngle = Math.min(1, Math.max(-1, dot / (magBA * magBC)));
      return Math.acos(cosAngle) * (180 / Math.PI);
    } catch (error) {
      console.error('Error calculating 3D angle:', error);
      return null;
    }
  }

  /**
   * Update sit-up counter using multi-metric flexible approach
   * Combines baseline calibration, distance ratios, head tracking, and torso cosine
   * Uses voting system for maximum flexibility across all camera angles
   */
  updateSitupCounter(landmarks) {
    try {
      const cfg = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const situpCfg = window.MediaPipeConfig?.SITUP_CONFIG || {};
      
      // Get key landmarks
      const leftShoulder = landmarks[cfg.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[cfg.RIGHT_SHOULDER || 12];
      const leftHip = landmarks[cfg.LEFT_HIP || 23];
      const rightHip = landmarks[cfg.RIGHT_HIP || 24];
      const leftKnee = landmarks[cfg.LEFT_KNEE || 25];
      const rightKnee = landmarks[cfg.RIGHT_KNEE || 26];
      const nose = landmarks[cfg.NOSE || 0];

      if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftKnee || !rightKnee) {
        return;
      }

      // Get state object
      const state = this.perModeState['situps'];
      if (!state) {
        console.error('❌ Sit-up state object not initialized');
        return;
      }

      const now = Date.now();

      // Calculate midpoints and vectors
      const shoulder = { 
        x: (leftShoulder.x + rightShoulder.x) / 2, 
        y: (leftShoulder.y + rightShoulder.y) / 2, 
        z: ((leftShoulder.z || 0) + (rightShoulder.z || 0)) / 2 
      };
      const hip = { 
        x: (leftHip.x + rightHip.x) / 2, 
        y: (leftHip.y + rightHip.y) / 2, 
        z: ((leftHip.z || 0) + (rightHip.z || 0)) / 2 
      };
      const knee = { 
        x: (leftKnee.x + rightKnee.x) / 2, 
        y: (leftKnee.y + rightKnee.y) / 2, 
        z: ((leftKnee.z || 0) + (rightKnee.z || 0)) / 2 
      };

      // Calculate torso vector and length
      const torsoVec = { 
        x: shoulder.x - hip.x, 
        y: shoulder.y - hip.y, 
        z: shoulder.z - hip.z 
      };
      const torsoLen = Math.hypot(torsoVec.x, torsoVec.y, torsoVec.z) || 1;

      // Calculate distances
      const shoulderKneeDist = Math.hypot(
        shoulder.x - knee.x, 
        shoulder.y - knee.y, 
        shoulder.z - knee.z
      );

      const headKneeDist = nose ? Math.hypot(
        nose.x - knee.x,
        nose.y - knee.y,
        (nose.z || 0) - knee.z
      ) : null;

      // === BASELINE CALIBRATION (first 30 frames) ===
      if (!state._baselineSamples) state._baselineSamples = [];
      if (!state._baseline && state._baselineSamples.length < (situpCfg.BASELINE_FRAMES || 30)) {
        const sample = { shoulderKneeDist, torsoLen };
        if (headKneeDist) sample.headKneeDist = headKneeDist;
        state._baselineSamples.push(sample);
        
        if (state._baselineSamples.length === (situpCfg.BASELINE_FRAMES || 30)) {
          const avgShoulderDist = state._baselineSamples.reduce((s, v) => s + v.shoulderKneeDist, 0) / state._baselineSamples.length;
          const avgTorso = state._baselineSamples.reduce((s, v) => s + v.torsoLen, 0) / state._baselineSamples.length;
          const avgHeadDist = state._baselineSamples.filter(v => v.headKneeDist).length > 0
            ? state._baselineSamples.reduce((s, v) => s + (v.headKneeDist || 0), 0) / state._baselineSamples.filter(v => v.headKneeDist).length
            : null;
          
          state._baseline = { 
            shoulderKneeDist: avgShoulderDist, 
            headKneeDist: avgHeadDist,
            torsoLen: avgTorso 
          };
          state.state = 'down';
          state.goodFrames = 0;
          state.badFrames = 0;
          state._lastRepAt = 0;
          
          console.log('✅ Sit-up baseline calibrated:', {
            shoulderDistance: avgShoulderDist.toFixed(3),
            headDistance: avgHeadDist?.toFixed(3) || 'N/A',
            torsoLen: avgTorso.toFixed(3)
          });
        }
        return; // Still calibrating
      }

      const baseline = state._baseline;
      if (!baseline) return;

      // === NORMALIZED METRICS ===
      // 1. Shoulder-knee distance ratio
      const shoulderRatio = shoulderKneeDist / baseline.shoulderKneeDist;

      // 2. Head-knee distance ratio (if available)
      const headRatio = (headKneeDist && baseline.headKneeDist) 
        ? headKneeDist / baseline.headKneeDist 
        : null;

      // 3. Torso cosine (dot product with up vector)
      const upVec = { x: 0, y: -1, z: 0 };
      const torsoCos = (torsoVec.x * upVec.x + torsoVec.y * upVec.y + torsoVec.z * upVec.z) / torsoLen;

      // 4. Hip angles for validation
      const hipAngleLeft = this.calculateAngle3D(leftShoulder, leftHip, leftKnee);
      const hipAngleRight = this.calculateAngle3D(rightShoulder, rightHip, rightKnee);
      const hipAngleAvg = (hipAngleLeft + hipAngleRight) / 2;

      // === MULTI-METRIC VOTING SYSTEM ===
      let downVotes = 0;
      let upVotes = 0;

      // Vote 1: Shoulder distance
      if (shoulderRatio > (situpCfg.SHOULDER_DOWN_RATIO || 0.88)) downVotes++;
      if (shoulderRatio < (situpCfg.SHOULDER_UP_RATIO || 0.62)) upVotes++;

      // Vote 2: Head distance (if available)
      if (headRatio !== null) {
        if (headRatio > (situpCfg.HEAD_DOWN_RATIO || 0.90)) downVotes++;
        if (headRatio < (situpCfg.HEAD_UP_RATIO || 0.55)) upVotes++;
      }

      // Vote 3: Torso cosine
      if (torsoCos < (situpCfg.DOWN_TORSO_COS || 0.35)) downVotes++;
      if (torsoCos > (situpCfg.UP_TORSO_COS || 0.70)) upVotes++;

      // Hip angle constraint (very relaxed, just prevents leg raises)
      const hipSupport = hipAngleAvg <= (situpCfg.HIP_ANGLE_MAX || 160);

      // Determine position based on votes
      const minDownVotes = situpCfg.MIN_METRICS_FOR_DOWN || 1;
      const minUpVotes = situpCfg.MIN_METRICS_FOR_UP || 2;

      const isDown = downVotes >= minDownVotes && hipSupport;
      const isUp = upVotes >= minUpVotes;

      // === HYSTERESIS ===
      const goodFramesNeeded = situpCfg.HYSTERESIS_GOOD || 2;
      const badFramesNeeded = situpCfg.HYSTERESIS_BAD || 3;

      if (isUp) {
        state.goodFrames = Math.min((state.goodFrames || 0) + 1, goodFramesNeeded);
        state.badFrames = 0;
      } else if (isDown) {
        state.badFrames = Math.min((state.badFrames || 0) + 1, badFramesNeeded);
        state.goodFrames = 0;
      } else {
        state.goodFrames = 0;
        state.badFrames = 0;
      }

      const minRepMs = situpCfg.MIN_REP_MS || 600;

      // === STATE MACHINE ===
      if (state.state === 'down' && state.goodFrames >= goodFramesNeeded && now - (state._lastRepAt || 0) > minRepMs) {
        state.state = 'up';
        state.count = (state.count || 0) + 1;
        state._lastRepAt = now;
        state.goodFrames = 0;

        console.log('🎯 Sit-up counted!', {
          shoulderRatio: shoulderRatio.toFixed(3),
          headRatio: headRatio?.toFixed(3) || 'N/A',
          torsoCos: torsoCos.toFixed(3),
          upVotes,
          count: state.count
        });

        this.playSuccessSound();
        if (this.onPushupCount) this.onPushupCount(state.count);
        if (this.onFormFeedback) {
          this.onFormFeedback({ 
            message: `Sit-up ${state.count}`, 
            type: 'success', 
            timestamp: now 
          });
        }
      } else if (state.state === 'up' && state.badFrames >= badFramesNeeded) {
        state.state = 'down';
        state.badFrames = 0;
        console.log('⬇️ Ready for next rep', {
          shoulderRatio: shoulderRatio.toFixed(3),
          headRatio: headRatio?.toFixed(3) || 'N/A',
          torsoCos: torsoCos.toFixed(3),
          downVotes
        });
      }

      // === DEBUG LOGGING ===
      if (Math.random() < 0.1) { // 10% of frames
        console.log('🔍 Sit-up Debug (Multi-Metric):', {
          // Ratios
          shoulderRatio: shoulderRatio.toFixed(3),
          headRatio: headRatio?.toFixed(3) || 'N/A',
          torsoCos: torsoCos.toFixed(3),
          hipAngleAvg: hipAngleAvg?.toFixed(1) + '°' || 'N/A',
          // Votes
          downVotes: `${downVotes}/3`,
          upVotes: `${upVotes}/3`,
          hipSupport,
          // Result
          isDown,
          isUp,
          // State
          state: state.state,
          count: state.count,
          goodFrames: state.goodFrames,
          badFrames: state.badFrames
        });
      }

    } catch (error) {
      console.error('Error updating sit-up counter:', error);
    }
  }

  updateBurpeesCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      // نقاط الرأس واليدين
      const nose = landmarks[config.NOSE || 0];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftIndex = landmarks[config.LEFT_INDEX || 19];
      const rightIndex = landmarks[config.RIGHT_INDEX || 20];
      if (!nose || !leftWrist || !rightWrist) return;
      // أعلى نقطة للرأس
      const headY = nose.y;
      // أعلى نقطة لليد أو الأصابع
      const leftHandY = leftIndex ? leftIndex.y : leftWrist.y;
      const rightHandY = rightIndex ? rightIndex.y : rightWrist.y;
      // إذا كانت اليدين أو الأصابع أعلى من الرأس (أقل في قيمة y)
      const handsAboveHead = (leftHandY < headY && rightHandY < headY);
      // منطق العد
      if (!this._burpeeState) this._burpeeState = 'ready';
      if (!this.perModeState['burpees']._burpeeState) this.perModeState['burpees']._burpeeState = 'ready';
      const bstate = this.perModeState['burpees'];
      if (bstate._burpeeState === 'ready') {
        if (handsAboveHead) {
          bstate._burpeeState = 'jumping';
          bstate.count += 1;
          this.playSuccessSound(); // Play success sound
          if (this.onPushupCount) this.onPushupCount(bstate.count);
          if (this.onFormFeedback) {
            this.onFormFeedback({
              message: `Burpee ${bstate.count} - Hands above head!`,
              type: 'success',
              timestamp: Date.now()
            });
          }
        }
      } else if (bstate._burpeeState === 'jumping') {
        if (!handsAboveHead) {
          bstate._burpeeState = 'ready';
        }
      }
    } catch (error) {
      console.error('Error updating burpees counter:', error);
    }
  }

  /**
   * Update high knees counter - robust detection with hip angle and vertical posture validation
   * Distinguishes high knees from other exercises by checking vertical stance and hip flexion
   */
  updateHighKneesCounter(landmarks) {
    try {
      const cfg = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const hkCfg = window.MediaPipeConfig?.HIGHKNEES_CONFIG || {};

      // Get landmarks
      const leftHip = landmarks[cfg.LEFT_HIP || 23];
      const rightHip = landmarks[cfg.RIGHT_HIP || 24];
      const leftKnee = landmarks[cfg.LEFT_KNEE || 25];
      const rightKnee = landmarks[cfg.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[cfg.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[cfg.RIGHT_ANKLE || 28];
      const leftShoulder = landmarks[cfg.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[cfg.RIGHT_SHOULDER || 12];

      if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftShoulder || !rightShoulder) {
        return;
      }

      // Initialize state for each leg independently
      const hkState = this.perModeState['highknees'];
      if (!hkState._leftState) hkState._leftState = 'down';
      if (!hkState._rightState) hkState._rightState = 'down';
      if (!hkState._leftLastRepAt) hkState._leftLastRepAt = 0;
      if (!hkState._rightLastRepAt) hkState._rightLastRepAt = 0;
      
      const now = Date.now();
      const MIN_REP_MS = 200; // Fast response

      // Calculate torso length for normalization
      const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
      const hipMidY = (leftHip.y + rightHip.y) / 2;
      const torsoLength = Math.abs(shoulderMidY - hipMidY) || 0.0001;

      // === VERTICAL POSTURE CHECK ===
      // Ensure user is standing upright (not in plank/pushup position)
      // In vertical stance, shoulders should be above hips
      const isVerticalPosture = shoulderMidY < hipMidY; // Y increases downward, so shoulders should have smaller Y
      
      if (!isVerticalPosture) {
        // User is horizontal (plank/pushup) - don't count
        return;
      }

      // Calculate knee heights (normalized by torso)
      const leftKneeHeight = (leftHip.y - leftKnee.y) / torsoLength;
      const rightKneeHeight = (rightHip.y - rightKnee.y) / torsoLength;

      // === KNEE ANGLE (Hip-Knee-Ankle) ===
      const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle || leftKnee);
      const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle || rightKnee);

      // === HIP ANGLE (Shoulder-Hip-Knee) ===
      // This is the key differentiator for high knees!
      // When lifting knee, hip flexes significantly
      const leftHipAngle = this.calculateAngle(leftShoulder, leftHip, leftKnee);
      const rightHipAngle = this.calculateAngle(rightShoulder, rightHip, rightKnee);

      // HIGH KNEES SPECIFIC THRESHOLDS
      const KNEE_ANGLE_FLEXED = 110; // Knee bent
      const KNEE_ANGLE_EXTENDED = 150; // Knee straight
      const HIP_ANGLE_FLEXED = 100; // Hip flexed (knee raised) - KEY for high knees!
      const HIP_ANGLE_EXTENDED = 160; // Hip extended (standing)
      const KNEE_HEIGHT_THRESHOLD = 0.08; // Backup height check
      
      // COMBINED DETECTION with hip angle validation
      // Must have: (knee flexed OR height sufficient) AND hip flexed AND vertical posture
      const leftKneeUp = (
        (leftKneeAngle <= KNEE_ANGLE_FLEXED || leftKneeHeight >= KNEE_HEIGHT_THRESHOLD) &&
        leftHipAngle <= HIP_ANGLE_FLEXED // Hip must be flexed!
      );
      
      const rightKneeUp = (
        (rightKneeAngle <= KNEE_ANGLE_FLEXED || rightKneeHeight >= KNEE_HEIGHT_THRESHOLD) &&
        rightHipAngle <= HIP_ANGLE_FLEXED // Hip must be flexed!
      );
      
      // For down detection, require both knee and hip to be extended
      const leftKneeDown = leftKneeAngle >= KNEE_ANGLE_EXTENDED && leftHipAngle >= HIP_ANGLE_EXTENDED;
      const rightKneeDown = rightKneeAngle >= KNEE_ANGLE_EXTENDED && rightHipAngle >= HIP_ANGLE_EXTENDED;

      // Process LEFT leg independently
      if (hkState._leftState === 'down') {
        if (leftKneeUp && (now - hkState._leftLastRepAt) > MIN_REP_MS) {
          hkState._leftState = 'up';
          hkState.count++;
          hkState._leftLastRepAt = now;
          
          console.log(`✅ HIGH KNEE ${hkState.count} (LEFT) - KneeAngle: ${Math.round(leftKneeAngle)}°, HipAngle: ${Math.round(leftHipAngle)}°, Height: ${leftKneeHeight.toFixed(2)}`);
          
          // Success feedback
          if (this.playSuccessSound) this.playSuccessSound();
          if (this.onPushupCount) this.onPushupCount(hkState.count);
          if (this.onFormFeedback) {
            this.onFormFeedback({
              message: `High Knees ${hkState.count}`,
              type: 'success',
              timestamp: now
            });
          }
        }
      } else if (hkState._leftState === 'up') {
        // Wait for left knee to extend (go down)
        if (leftKneeDown) {
          hkState._leftState = 'down';
        }
      }

      // Process RIGHT leg independently
      if (hkState._rightState === 'down') {
        if (rightKneeUp && (now - hkState._rightLastRepAt) > MIN_REP_MS) {
          hkState._rightState = 'up';
          hkState.count++;
          hkState._rightLastRepAt = now;
          
          console.log(`✅ HIGH KNEE ${hkState.count} (RIGHT) - KneeAngle: ${Math.round(rightKneeAngle)}°, HipAngle: ${Math.round(rightHipAngle)}°, Height: ${rightKneeHeight.toFixed(2)}`);
          
          // Success feedback
          if (this.playSuccessSound) this.playSuccessSound();
          if (this.onPushupCount) this.onPushupCount(hkState.count);
          if (this.onFormFeedback) {
            this.onFormFeedback({
              message: `High Knees ${hkState.count}`,
              type: 'success',
              timestamp: now
            });
          }
        }
      } else if (hkState._rightState === 'up') {
        // Wait for right knee to extend (go down)
        if (rightKneeDown) {
          hkState._rightState = 'down';
        }
      }

    } catch (err) {
      console.error("❌ Error in updateHighKneesCounter:", err);
    }
  }


  // Update jumping jacks counter
  updateJumpingJacksCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const jjConfig = window.MediaPipeConfig?.JUMPINGJACKS_CONFIG || {};

      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const leftAnkle = landmarks[config.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[config.RIGHT_ANKLE || 28];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];

      if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder || !leftAnkle || !rightAnkle || !leftHip || !rightHip) {
        console.log('❌ JJ: Missing landmarks');
        return;
      }
      
      // Debug log (sample 2% of frames)
      if (Math.random() < 0.02) {
        console.log('✅ JJ: Processing frame with all landmarks');
      }

      const jjState = this.perModeState['jumpingjacks'];
      if (!jjState._lastRepAt) jjState._lastRepAt = 0;
      if (!jjState._upStateStartTime) jjState._upStateStartTime = 0;
      const now = Date.now();
      const MIN_REP_MS = jjConfig.MIN_REP_MS || 500;
      const MIN_UP_TIME = 200; // 0.2 seconds hold time for UP state

      // Compute shoulder width from landmarks (use calibration if available)
      let shoulderWidth;
      if (this.calibrationData && !this.calibrationData.isDefault) {
        shoulderWidth = this.calibrationData.shoulderWidth;
      } else {
        // Compute from current landmarks - use simple horizontal distance like original
        shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
      }

      // Per-limb visibility weighting - use counterpart if one limb has low visibility
      const minVisibility = 0.5;
      
      // Wrist positions with visibility weighting
      let wristAboveShoulderLeft = leftWrist.y < leftShoulder.y;
      let wristAboveShoulderRight = rightWrist.y < rightShoulder.y;
      
      if (leftWrist.visibility < minVisibility && rightWrist.visibility >= minVisibility) {
        wristAboveShoulderLeft = wristAboveShoulderRight;
      } else if (rightWrist.visibility < minVisibility && leftWrist.visibility >= minVisibility) {
        wristAboveShoulderRight = wristAboveShoulderLeft;
      }
      
      const wristsUp = wristAboveShoulderLeft && wristAboveShoulderRight;

      // Wrist below hip positions with visibility weighting
      let wristBelowHipLeft = leftWrist.y > leftHip.y;
      let wristBelowHipRight = rightWrist.y > rightHip.y;
      
      if (leftWrist.visibility < minVisibility && rightWrist.visibility >= minVisibility) {
        wristBelowHipLeft = wristBelowHipRight;
      } else if (rightWrist.visibility < minVisibility && leftWrist.visibility >= minVisibility) {
        wristBelowHipRight = wristBelowHipLeft;
      }
      
      const wristsDown = wristBelowHipLeft && wristBelowHipRight;

      // Ankle distance computation - use simple horizontal distance like original
      let ankleDistance = Math.abs(leftAnkle.x - rightAnkle.x);
      
      // If one ankle has low visibility, estimate from the other
      if ((leftAnkle.visibility < minVisibility || rightAnkle.visibility < minVisibility) &&
          !(leftAnkle.visibility < minVisibility && rightAnkle.visibility < minVisibility)) {
        // Use shoulder width as fallback estimate
        ankleDistance = shoulderWidth * 1.5;
      }

      // UP position: wrists above shoulders AND ankles wider than shoulders
      // With 0.2s hold time requirement
      const anklesApart = ankleDistance > (shoulderWidth * 1.5);
      const isUpPosition = wristsUp && anklesApart;

      // Track UP state timing
      if (isUpPosition) {
        if (jjState._upStateStartTime === 0) {
          jjState._upStateStartTime = now;
        }
      } else {
        jjState._upStateStartTime = 0;
      }

      // Check if UP state has been held long enough
      const upStateHeldLongEnough = (jjState._upStateStartTime > 0) && 
                                     ((now - jjState._upStateStartTime) >= MIN_UP_TIME);

      // DOWN position: wrists near hips AND ankles together
      const anklesTogether = ankleDistance < (shoulderWidth * 0.9);
      const isDown = wristsDown && anklesTogether;

      // Debug logging (sample 5% of frames)
      if (Math.random() < 0.05) {
        console.log('🔍 JJ State:', {
          currentState: jjState.state,
          isUpPosition,
          isDown,
          upStateHeldLongEnough,
          wristsUp,
          wristsDown,
          anklesApart,
          anklesTogether,
          ankleDistance: ankleDistance.toFixed(3),
          shoulderWidth: shoulderWidth.toFixed(3),
          upThreshold: (shoulderWidth * 1.5).toFixed(3),
          downThreshold: (shoulderWidth * 0.9).toFixed(3)
        });
      }

      // State machine: same as original but with UP hold time requirement
      if (jjState.state === 'down' || !jjState.state) {
        if (upStateHeldLongEnough) {
          jjState.state = 'up';
          console.log('🟢 JJ: Transitioned to UP state');
        }
      } else { // state is 'up'
        if (isDown) {
          if ((now - jjState._lastRepAt) > MIN_REP_MS) {
            jjState.state = 'down';
            jjState.count += 1;
            jjState._lastRepAt = now;
            console.log('🔵 JJ: Counted rep #' + jjState.count);
            this.playSuccessSound();
            if (this.onPushupCount) this.onPushupCount(jjState.count);
            if (this.onFormFeedback) {
              this.onFormFeedback({ message: `Jumping Jack ${jjState.count}`, type: 'success', timestamp: now });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating jumping jacks counter:', error);
    }
  }

  // Update side plank counter (time-based like regular plank)
  updateSidePlankCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const spConfig = window.MediaPipeConfig?.SIDEPLANK_CONFIG || {};

      // Get key landmarks for side plank
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const leftElbow = landmarks[config.LEFT_ELBOW || 13];
      const rightElbow = landmarks[config.RIGHT_ELBOW || 14];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];
      const leftKnee = landmarks[config.LEFT_KNEE || 25];
      const rightKnee = landmarks[config.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[config.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[config.RIGHT_ANKLE || 28];
      const nose = landmarks[config.NOSE || 0];
      const leftEar = landmarks[config.LEFT_EAR || 7];
      const rightEar = landmarks[config.RIGHT_EAR || 8];

      // Check visibility of key landmarks
      const vis = (p) => p && (p.visibility == null || p.visibility > 0.5);

      // Determine which side is the support side (left or right)
      // We'll check both sides and use the one with better visibility
      const leftSideVisible = vis(leftShoulder) && vis(leftElbow) && vis(leftHip) && vis(leftKnee) && vis(leftAnkle);
      const rightSideVisible = vis(rightShoulder) && vis(rightElbow) && vis(rightHip) && vis(rightKnee) && vis(rightAnkle);

      if (!leftSideVisible && !rightSideVisible) {
        return; // Not enough landmarks visible
      }

      // Use the side with better visibility
      const isLeftSide = leftSideVisible && (!rightSideVisible || leftSideVisible);
      const supportShoulder = isLeftSide ? leftShoulder : rightShoulder;
      const supportElbow = isLeftSide ? leftElbow : rightElbow;
      const supportWrist = isLeftSide ? leftWrist : rightWrist;
      const supportHip = isLeftSide ? leftHip : rightHip;
      const supportKnee = isLeftSide ? leftKnee : rightKnee;
      const supportAnkle = isLeftSide ? leftAnkle : rightAnkle;
      const supportEar = isLeftSide ? leftEar : rightEar;

      // Calculate key angles for side plank validation

      // 1. Shoulder Support Angle (shoulder-elbow-wrist) - should be ~90°
      const shoulderSupportAngle = this.calculateAngle(supportShoulder, supportElbow, supportWrist);
      const SHOULDER_ANGLE_MIN = spConfig.SHOULDER_ANGLE_MIN || 80;
      const SHOULDER_ANGLE_MAX = spConfig.SHOULDER_ANGLE_MAX || 100;
      const shoulderAngleGood = shoulderSupportAngle >= SHOULDER_ANGLE_MIN && shoulderSupportAngle <= SHOULDER_ANGLE_MAX;

      // 2. Torso-Hip Line (shoulder-hip-ankle) - should be ~180° (straight line)
      const torsoHipAngle = this.calculateAngle(supportShoulder, supportHip, supportAnkle);
      const TORSO_ANGLE_MIN = spConfig.TORSO_ANGLE_MIN || 160;
      const TORSO_ANGLE_MAX = spConfig.TORSO_ANGLE_MAX || 200;
      const torsoAngleGood = torsoHipAngle >= TORSO_ANGLE_MIN && torsoHipAngle <= TORSO_ANGLE_MAX;

      // 3. Check for hip sag (hip drops below shoulder-ankle line)
      const shoulderAnkleMidY = (supportShoulder.y + supportAnkle.y) / 2;
      const hipSagThreshold = spConfig.HIP_SAG_THRESHOLD || 0.05; // normalized units
      const hipSag = supportHip.y > (shoulderAnkleMidY + hipSagThreshold);

      // 4. Check for hip hike (hip rises above shoulder-ankle line)
      const hipHikeThreshold = spConfig.HIP_HIKE_THRESHOLD || 0.05; // normalized units
      const hipHike = supportHip.y < (shoulderAnkleMidY - hipHikeThreshold);

      // 5. Check elbow alignment (elbow should be under shoulder)
      const elbowAlignmentThreshold = spConfig.ELBOW_ALIGNMENT_THRESHOLD || 0.08; // normalized units
      const elbowAligned = Math.abs(supportElbow.x - supportShoulder.x) < elbowAlignmentThreshold;

      // 6. Check feet stacking (ankles should be close together)
      const feetStackingThreshold = spConfig.FEET_STACKING_THRESHOLD || 0.1; // normalized units
      const feetStacked = Math.abs(leftAnkle.x - rightAnkle.x) < feetStackingThreshold;

      // 7. Head-neck alignment (ear-shoulder-hip should be ~180°)
      let headNeckGood = true;
      if (supportEar && vis(supportEar)) {
        const headNeckAngle = this.calculateAngle(supportEar, supportShoulder, supportHip);
        const HEAD_NECK_ANGLE_MIN = spConfig.HEAD_NECK_ANGLE_MIN || 160;
        const HEAD_NECK_ANGLE_MAX = spConfig.HEAD_NECK_ANGLE_MAX || 200;
        headNeckGood = headNeckAngle >= HEAD_NECK_ANGLE_MIN && headNeckAngle <= HEAD_NECK_ANGLE_MAX;
      }

      // Overall posture assessment
      const isGoodPosture = shoulderAngleGood &&
        torsoAngleGood &&
        !hipSag &&
        !hipHike &&
        elbowAligned &&
        feetStacked &&
        headNeckGood;

      // Debug logging
      console.log('🔍 Side Plank Debug:', {
        side: isLeftSide ? 'Left' : 'Right',
        shoulderAngle: Math.round(shoulderSupportAngle),
        torsoAngle: Math.round(torsoHipAngle),
        hipSag,
        hipHike,
        elbowAligned,
        feetStacked,
        headNeckGood,
        isGoodPosture,
        postureStatus: this.postureStatus
      });

      // Update posture status with smoothing
      if (isGoodPosture) {
        this._postureGoodCount = (this._postureGoodCount || 0) + 1;
        this._postureBadCount = 0;
      } else {
        this._postureBadCount = (this._postureBadCount || 0) + 1;
        this._postureGoodCount = 0;
      }

      const POSTURE_GOOD_FRAMES = spConfig.POSTURE_GOOD_FRAMES || 3;
      const POSTURE_BAD_FRAMES = spConfig.POSTURE_BAD_FRAMES || 4;

      let smoothedStatus = this.postureStatus;
      if (this._postureGoodCount >= POSTURE_GOOD_FRAMES) {
        smoothedStatus = 'correct';
      } else if (this._postureBadCount >= POSTURE_BAD_FRAMES) {
        smoothedStatus = 'incorrect';
      }

      if (smoothedStatus !== this.postureStatus) {
        this.postureStatus = smoothedStatus;
        if (this.onPostureChange) this.onPostureChange(this.postureStatus, landmarks);
      }

      // Handle timing for side plank (similar to regular plank)
      if (this.postureStatus === 'correct') {
        const now = Date.now();
        if (!this.timerRunning) {
          this.startCorrectTimestampMs = now;
          this.timerRunning = true;
        }
        const totalMs = this.accumulatedCorrectMs + (now - (this.startCorrectTimestampMs || now));
        const seconds = Math.floor(totalMs / 1000);
        if (this.onTimeUpdate) this.onTimeUpdate(seconds);
      } else {
        // Stop timer when posture is incorrect
        if (this.timerRunning) {
          this.accumulatedCorrectMs += Date.now() - this.startCorrectTimestampMs;
          this.timerRunning = false;
          this.startCorrectTimestampMs = 0;
          if (this.onTimeUpdate) {
            this.onTimeUpdate(Math.floor(this.accumulatedCorrectMs / 1000));
          }
        }
      }

      // Provide form feedback for common mistakes
      if (!isGoodPosture && this.onFormFeedback) {
        const currentTime = Date.now();
        const cooldown = spConfig.WARNING_COOLDOWN || 2000;

        if (currentTime - this.lastWarningTime > cooldown) {
          let feedbackMessage = '';
          if (hipSag) {
            feedbackMessage = 'Hip sagging - lift your hips up!';
          } else if (hipHike) {
            feedbackMessage = 'Hip too high - lower your hips!';
          } else if (!elbowAligned) {
            feedbackMessage = 'Keep elbow under shoulder!';
          } else if (!feetStacked) {
            feedbackMessage = 'Stack your feet together!';
          } else if (!shoulderAngleGood) {
            feedbackMessage = 'Adjust your arm position!';
          } else if (!torsoAngleGood) {
            feedbackMessage = 'Keep your body straight!';
          }

          if (feedbackMessage) {
            this.onFormFeedback({
              message: feedbackMessage,
              type: 'warning',
              timestamp: currentTime
            });
            this.lastWarningTime = currentTime;
          }
        }
      }

    } catch (error) {
      console.error('Error updating side plank counter:', error);
    }
  }

  // Update straight arm plank counter (exact copy of side plank behavior)
  updateStraightArmPlankCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const spConfig = window.MediaPipeConfig?.SIDEPLANK_CONFIG || {};

      // Get key landmarks for side plank
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const leftElbow = landmarks[config.LEFT_ELBOW || 13];
      const rightElbow = landmarks[config.RIGHT_ELBOW || 14];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];
      const leftKnee = landmarks[config.LEFT_KNEE || 25];
      const rightKnee = landmarks[config.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[config.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[config.RIGHT_ANKLE || 28];
      const nose = landmarks[config.NOSE || 0];
      const leftEar = landmarks[config.LEFT_EAR || 7];
      const rightEar = landmarks[config.RIGHT_EAR || 8];

      // Check visibility of key landmarks
      const vis = (p) => p && (p.visibility == null || p.visibility > 0.5);

      // Determine which side is the support side (left or right)
      // We'll check both sides and use the one with better visibility
      const leftSideVisible = vis(leftShoulder) && vis(leftElbow) && vis(leftHip) && vis(leftKnee) && vis(leftAnkle);
      const rightSideVisible = vis(rightShoulder) && vis(rightElbow) && vis(rightHip) && vis(rightKnee) && vis(rightAnkle);

      if (!leftSideVisible && !rightSideVisible) {
        return; // Not enough landmarks visible
      }

      // Use the side with better visibility
      const isLeftSide = leftSideVisible && (!rightSideVisible || leftSideVisible);
      const supportShoulder = isLeftSide ? leftShoulder : rightShoulder;
      const supportElbow = isLeftSide ? leftElbow : rightElbow;
      const supportWrist = isLeftSide ? leftWrist : rightWrist;
      const supportHip = isLeftSide ? leftHip : rightHip;
      const supportKnee = isLeftSide ? leftKnee : rightKnee;
      const supportAnkle = isLeftSide ? leftAnkle : rightAnkle;
      const supportEar = isLeftSide ? leftEar : rightEar;

      // Calculate key angles for side plank validation

      // 1. Shoulder Support Angle (shoulder-elbow-wrist) - should be ~90°
      const shoulderSupportAngle = this.calculateAngle(supportShoulder, supportElbow, supportWrist);
      const SHOULDER_ANGLE_MIN = spConfig.SHOULDER_ANGLE_MIN || 80;
      const SHOULDER_ANGLE_MAX = spConfig.SHOULDER_ANGLE_MAX || 100;
      const shoulderAngleGood = shoulderSupportAngle >= SHOULDER_ANGLE_MIN && shoulderSupportAngle <= SHOULDER_ANGLE_MAX;

      // 2. Torso-Hip Line (shoulder-hip-ankle) - should be ~180° (straight line)
      const torsoHipAngle = this.calculateAngle(supportShoulder, supportHip, supportAnkle);
      const TORSO_ANGLE_MIN = spConfig.TORSO_ANGLE_MIN || 160;
      const TORSO_ANGLE_MAX = spConfig.TORSO_ANGLE_MAX || 200;
      const torsoAngleGood = torsoHipAngle >= TORSO_ANGLE_MIN && torsoHipAngle <= TORSO_ANGLE_MAX;

      // 3. Check for hip sag (hip drops below shoulder-ankle line)
      const shoulderAnkleMidY = (supportShoulder.y + supportAnkle.y) / 2;
      const hipSagThreshold = spConfig.HIP_SAG_THRESHOLD || 0.05; // normalized units
      const hipSag = supportHip.y > (shoulderAnkleMidY + hipSagThreshold);

      // 4. Check for hip hike (hip rises above shoulder-ankle line)
      const hipHikeThreshold = spConfig.HIP_HIKE_THRESHOLD || 0.05; // normalized units
      const hipHike = supportHip.y < (shoulderAnkleMidY - hipHikeThreshold);

      // 5. Check elbow alignment (elbow should be under shoulder)
      const elbowAlignmentThreshold = spConfig.ELBOW_ALIGNMENT_THRESHOLD || 0.08; // normalized units
      const elbowAligned = Math.abs(supportElbow.x - supportShoulder.x) < elbowAlignmentThreshold;

      // 6. Check feet stacking (ankles should be close together)
      const feetStackingThreshold = spConfig.FEET_STACKING_THRESHOLD || 0.1; // normalized units
      const feetStacked = Math.abs(leftAnkle.x - rightAnkle.x) < feetStackingThreshold;

      // 7. Head-neck alignment (ear-shoulder-hip should be ~180°)
      let headNeckGood = true;
      if (supportEar && vis(supportEar)) {
        const headNeckAngle = this.calculateAngle(supportEar, supportShoulder, supportHip);
        const HEAD_NECK_ANGLE_MIN = spConfig.HEAD_NECK_ANGLE_MIN || 160;
        const HEAD_NECK_ANGLE_MAX = spConfig.HEAD_NECK_ANGLE_MAX || 200;
        headNeckGood = headNeckAngle >= HEAD_NECK_ANGLE_MIN && headNeckAngle <= HEAD_NECK_ANGLE_MAX;
      }

      // Overall posture assessment
      const isGoodPosture = shoulderAngleGood &&
        torsoAngleGood &&
        !hipSag &&
        !hipHike &&
        elbowAligned &&
        feetStacked &&
        headNeckGood;

      // Debug logging
      console.log('🔍 Straight Arm Plank Debug:', {
        side: isLeftSide ? 'Left' : 'Right',
        shoulderAngle: Math.round(shoulderSupportAngle),
        torsoAngle: Math.round(torsoHipAngle),
        hipSag,
        hipHike,
        elbowAligned,
        feetStacked,
        headNeckGood,
        isGoodPosture,
        postureStatus: this.postureStatus
      });

      // Update posture status with smoothing
      if (isGoodPosture) {
        this._postureGoodCount = (this._postureGoodCount || 0) + 1;
        this._postureBadCount = 0;
      } else {
        this._postureBadCount = (this._postureBadCount || 0) + 1;
        this._postureGoodCount = 0;
      }

      const POSTURE_GOOD_FRAMES = spConfig.POSTURE_GOOD_FRAMES || 3;
      const POSTURE_BAD_FRAMES = spConfig.POSTURE_BAD_FRAMES || 4;

      let smoothedStatus = this.postureStatus;
      if (this._postureGoodCount >= POSTURE_GOOD_FRAMES) {
        smoothedStatus = 'correct';
      } else if (this._postureBadCount >= POSTURE_BAD_FRAMES) {
        smoothedStatus = 'incorrect';
      }

      if (smoothedStatus !== this.postureStatus) {
        this.postureStatus = smoothedStatus;
        if (this.onPostureChange) this.onPostureChange(this.postureStatus, landmarks);
      }

      // Handle timing for side plank (similar to regular plank)
      if (this.postureStatus === 'correct') {
        const now = Date.now();
        if (!this.timerRunning) {
          this.startCorrectTimestampMs = now;
          this.timerRunning = true;
        }
        const totalMs = this.accumulatedCorrectMs + (now - (this.startCorrectTimestampMs || now));
        const seconds = Math.floor(totalMs / 1000);
        if (this.onTimeUpdate) this.onTimeUpdate(seconds);
      } else {
        // Stop timer when posture is incorrect
        if (this.timerRunning) {
          this.accumulatedCorrectMs += Date.now() - this.startCorrectTimestampMs;
          this.timerRunning = false;
          this.startCorrectTimestampMs = 0;
          if (this.onTimeUpdate) {
            this.onTimeUpdate(Math.floor(this.accumulatedCorrectMs / 1000));
          }
        }
      }

      // Provide form feedback for common mistakes
      if (!isGoodPosture && this.onFormFeedback) {
        const currentTime = Date.now();
        const cooldown = spConfig.WARNING_COOLDOWN || 2000;

        if (currentTime - this.lastWarningTime > cooldown) {
          let feedbackMessage = '';
          if (hipSag) {
            feedbackMessage = 'Hip sagging - lift your hips up!';
          } else if (hipHike) {
            feedbackMessage = 'Hip too high - lower your hips!';
          } else if (!elbowAligned) {
            feedbackMessage = 'Keep elbow under shoulder!';
          } else if (!feetStacked) {
            feedbackMessage = 'Stack your feet together!';
          } else if (!shoulderAngleGood) {
            feedbackMessage = 'Adjust your arm position!';
          } else if (!torsoAngleGood) {
            feedbackMessage = 'Keep your body straight!';
          }

          if (feedbackMessage) {
            this.onFormFeedback({
              message: feedbackMessage,
              type: 'warning',
              timestamp: currentTime
            });
            this.lastWarningTime = currentTime;
          }
        }
      }

    } catch (error) {
      console.error('Error updating straight arm plank counter:', error);
    }
  }

  // Update reverse straight arm plank counter (exact copy of straight arm plank)
  updateReverseStraightArmPlankCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const spConfig = window.MediaPipeConfig?.SIDEPLANK_CONFIG || {};

      // Get key landmarks for side plank
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const leftElbow = landmarks[config.LEFT_ELBOW || 13];
      const rightElbow = landmarks[config.RIGHT_ELBOW || 14];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];
      const leftKnee = landmarks[config.LEFT_KNEE || 25];
      const rightKnee = landmarks[config.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[config.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[config.RIGHT_ANKLE || 28];
      const nose = landmarks[config.NOSE || 0];
      const leftEar = landmarks[config.LEFT_EAR || 7];
      const rightEar = landmarks[config.RIGHT_EAR || 8];

      // Check visibility of key landmarks
      const vis = (p) => p && (p.visibility == null || p.visibility > 0.5);

      // Determine which side is the support side (left or right)
      // We'll check both sides and use the one with better visibility
      const leftSideVisible = vis(leftShoulder) && vis(leftElbow) && vis(leftHip) && vis(leftKnee) && vis(leftAnkle);
      const rightSideVisible = vis(rightShoulder) && vis(rightElbow) && vis(rightHip) && vis(rightKnee) && vis(rightAnkle);

      if (!leftSideVisible && !rightSideVisible) {
        return; // Not enough landmarks visible
      }

      // Use the side with better visibility
      const isLeftSide = leftSideVisible && (!rightSideVisible || leftSideVisible);
      const supportShoulder = isLeftSide ? leftShoulder : rightShoulder;
      const supportElbow = isLeftSide ? leftElbow : rightElbow;
      const supportWrist = isLeftSide ? leftWrist : rightWrist;
      const supportHip = isLeftSide ? leftHip : rightHip;
      const supportKnee = isLeftSide ? leftKnee : rightKnee;
      const supportAnkle = isLeftSide ? leftAnkle : rightAnkle;
      const supportEar = isLeftSide ? leftEar : rightEar;

      // Calculate key angles for side plank validation

      // 1. Shoulder Support Angle (shoulder-elbow-wrist) - should be ~90°
      const shoulderSupportAngle = this.calculateAngle(supportShoulder, supportElbow, supportWrist);
      const SHOULDER_ANGLE_MIN = spConfig.SHOULDER_ANGLE_MIN || 80;
      const SHOULDER_ANGLE_MAX = spConfig.SHOULDER_ANGLE_MAX || 100;
      const shoulderAngleGood = shoulderSupportAngle >= SHOULDER_ANGLE_MIN && shoulderSupportAngle <= SHOULDER_ANGLE_MAX;

      // 2. Torso-Hip Line (shoulder-hip-ankle) - should be ~180° (straight line)
      const torsoHipAngle = this.calculateAngle(supportShoulder, supportHip, supportAnkle);
      const TORSO_ANGLE_MIN = spConfig.TORSO_ANGLE_MIN || 160;
      const TORSO_ANGLE_MAX = spConfig.TORSO_ANGLE_MAX || 200;
      const torsoAngleGood = torsoHipAngle >= TORSO_ANGLE_MIN && torsoHipAngle <= TORSO_ANGLE_MAX;

      // 3. Check for hip sag (hip drops below shoulder-ankle line)
      const shoulderAnkleMidY = (supportShoulder.y + supportAnkle.y) / 2;
      const hipSagThreshold = spConfig.HIP_SAG_THRESHOLD || 0.05; // normalized units
      const hipSag = supportHip.y > (shoulderAnkleMidY + hipSagThreshold);

      // 4. Check for hip hike (hip rises above shoulder-ankle line)
      const hipHikeThreshold = spConfig.HIP_HIKE_THRESHOLD || 0.05; // normalized units
      const hipHike = supportHip.y < (shoulderAnkleMidY - hipHikeThreshold);

      // 5. Check elbow alignment (elbow should be under shoulder)
      const elbowAlignmentThreshold = spConfig.ELBOW_ALIGNMENT_THRESHOLD || 0.08; // normalized units
      const elbowAligned = Math.abs(supportElbow.x - supportShoulder.x) < elbowAlignmentThreshold;

      // 6. Check feet stacking (ankles should be close together)
      const feetStackingThreshold = spConfig.FEET_STACKING_THRESHOLD || 0.1; // normalized units
      const feetStacked = Math.abs(leftAnkle.x - rightAnkle.x) < feetStackingThreshold;

      // 7. Head-neck alignment (ear-shoulder-hip should be ~180°)
      let headNeckGood = true;
      if (supportEar && vis(supportEar)) {
        const headNeckAngle = this.calculateAngle(supportEar, supportShoulder, supportHip);
        const HEAD_NECK_ANGLE_MIN = spConfig.HEAD_NECK_ANGLE_MIN || 160;
        const HEAD_NECK_ANGLE_MAX = spConfig.HEAD_NECK_ANGLE_MAX || 200;
        headNeckGood = headNeckAngle >= HEAD_NECK_ANGLE_MIN && headNeckAngle <= HEAD_NECK_ANGLE_MAX;
      }

      // Overall posture assessment
      const isGoodPosture = shoulderAngleGood &&
        torsoAngleGood &&
        !hipSag &&
        !hipHike &&
        elbowAligned &&
        feetStacked &&
        headNeckGood;

      // Debug logging
      console.log('🔍 Reverse Straight Arm Plank Debug:', {
        side: isLeftSide ? 'Left' : 'Right',
        shoulderAngle: Math.round(shoulderSupportAngle),
        torsoAngle: Math.round(torsoHipAngle),
        hipSag,
        hipHike,
        elbowAligned,
        feetStacked,
        headNeckGood,
        isGoodPosture,
        postureStatus: this.postureStatus
      });

      // Update posture status with smoothing
      if (isGoodPosture) {
        this._postureGoodCount = (this._postureGoodCount || 0) + 1;
        this._postureBadCount = 0;
      } else {
        this._postureBadCount = (this._postureBadCount || 0) + 1;
        this._postureGoodCount = 0;
      }

      const POSTURE_GOOD_FRAMES = spConfig.POSTURE_GOOD_FRAMES || 3;
      const POSTURE_BAD_FRAMES = spConfig.POSTURE_BAD_FRAMES || 4;

      let smoothedStatus = this.postureStatus;
      if (this._postureGoodCount >= POSTURE_GOOD_FRAMES) {
        smoothedStatus = 'correct';
      } else if (this._postureBadCount >= POSTURE_BAD_FRAMES) {
        smoothedStatus = 'incorrect';
      }

      if (smoothedStatus !== this.postureStatus) {
        this.postureStatus = smoothedStatus;
        if (this.onPostureChange) this.onPostureChange(this.postureStatus, landmarks);
      }

      // Handle timing for side plank (similar to regular plank)
      if (this.postureStatus === 'correct') {
        const now = Date.now();
        if (!this.timerRunning) {
          this.startCorrectTimestampMs = now;
          this.timerRunning = true;
        }
        const totalMs = this.accumulatedCorrectMs + (now - (this.startCorrectTimestampMs || now));
        const seconds = Math.floor(totalMs / 1000);
        if (this.onTimeUpdate) this.onTimeUpdate(seconds);
      } else {
        // Stop timer when posture is incorrect
        if (this.timerRunning) {
          this.accumulatedCorrectMs += Date.now() - this.startCorrectTimestampMs;
          this.timerRunning = false;
          this.startCorrectTimestampMs = 0;
          if (this.onTimeUpdate) {
            this.onTimeUpdate(Math.floor(this.accumulatedCorrectMs / 1000));
          }
        }
      }

      // Provide form feedback for common mistakes
      if (!isGoodPosture && this.onFormFeedback) {
        const currentTime = Date.now();
        const cooldown = spConfig.WARNING_COOLDOWN || 2000;

        if (currentTime - this.lastWarningTime > cooldown) {
          let feedbackMessage = '';
          if (hipSag) {
            feedbackMessage = 'Hip sagging - lift your hips up!';
          } else if (hipHike) {
            feedbackMessage = 'Hip too high - lower your hips!';
          } else if (!elbowAligned) {
            feedbackMessage = 'Keep elbow under shoulder!';
          } else if (!feetStacked) {
            feedbackMessage = 'Stack your feet together!';
          } else if (!shoulderAngleGood) {
            feedbackMessage = 'Adjust your arm position!';
          } else if (!torsoAngleGood) {
            feedbackMessage = 'Keep your body straight!';
          }

          if (feedbackMessage) {
            this.onFormFeedback({
              message: feedbackMessage,
              type: 'warning',
              timestamp: currentTime
            });
            this.lastWarningTime = currentTime;
          }
        }
      }

    } catch (error) {
      console.error('Error updating reverse straight arm plank counter:', error);
    }
  }

  // Update knee plank counter (duplicate of straight arm plank logic but separate mode)
  updateKneePlankCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const spConfig = window.MediaPipeConfig?.SIDEPLANK_CONFIG || {};

      // Get key landmarks for knee plank (same as side/straight arm plank)
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const leftElbow = landmarks[config.LEFT_ELBOW || 13];
      const rightElbow = landmarks[config.RIGHT_ELBOW || 14];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];
      const leftKnee = landmarks[config.LEFT_KNEE || 25];
      const rightKnee = landmarks[config.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[config.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[config.RIGHT_ANKLE || 28];
      const nose = landmarks[config.NOSE || 0];
      const leftEar = landmarks[config.LEFT_EAR || 7];
      const rightEar = landmarks[config.RIGHT_EAR || 8];

      // Check visibility of key landmarks
      const vis = (p) => p && (p.visibility == null || p.visibility > 0.5);

      // Determine which side is the support side (left or right)
      const leftSideVisible = vis(leftShoulder) && vis(leftElbow) && vis(leftHip) && vis(leftKnee);
      const rightSideVisible = vis(rightShoulder) && vis(rightElbow) && vis(rightHip) && vis(rightKnee);

      if (!leftSideVisible && !rightSideVisible) {
        return; // Not enough landmarks visible
      }

      // Use the side with better visibility
      const isLeftSide = leftSideVisible && (!rightSideVisible || leftSideVisible);
      const supportShoulder = isLeftSide ? leftShoulder : rightShoulder;
      const supportElbow = isLeftSide ? leftElbow : rightElbow;
      const supportWrist = isLeftSide ? leftWrist : rightWrist;
      const supportHip = isLeftSide ? leftHip : rightHip;
      const supportKnee = isLeftSide ? leftKnee : rightKnee;
      const supportAnkle = isLeftSide ? leftAnkle : rightAnkle;
      const supportEar = isLeftSide ? leftEar : rightEar;

      // Calculate angles and checks (similar to straight arm plank)
      const shoulderSupportAngle = this.calculateAngle(supportShoulder, supportElbow, supportWrist);
      const SHOULDER_ANGLE_MIN = spConfig.SHOULDER_ANGLE_MIN || 80;
      const SHOULDER_ANGLE_MAX = spConfig.SHOULDER_ANGLE_MAX || 100;
      const shoulderAngleGood = shoulderSupportAngle >= SHOULDER_ANGLE_MIN && shoulderSupportAngle <= SHOULDER_ANGLE_MAX;

      const torsoHipAngle = this.calculateAngle(supportShoulder, supportHip, supportAnkle || supportKnee);
      const TORSO_ANGLE_MIN = spConfig.TORSO_ANGLE_MIN || 140; // allow a bit more tolerance for knee-supported planks
      const TORSO_ANGLE_MAX = spConfig.TORSO_ANGLE_MAX || 200;
      const torsoAngleGood = torsoHipAngle >= TORSO_ANGLE_MIN && torsoHipAngle <= TORSO_ANGLE_MAX;

      const shoulderAnkleMidY = (supportShoulder.y + (supportAnkle ? supportAnkle.y : supportKnee.y)) / 2;
      const hipSagThreshold = spConfig.HIP_SAG_THRESHOLD || 0.06; // slightly relaxed
      const hipSag = supportHip.y > (shoulderAnkleMidY + hipSagThreshold);
      const hipHikeThreshold = spConfig.HIP_HIKE_THRESHOLD || 0.06;
      const hipHike = supportHip.y < (shoulderAnkleMidY - hipHikeThreshold);

      const elbowAlignmentThreshold = spConfig.ELBOW_ALIGNMENT_THRESHOLD || 0.1;
      const elbowAligned = Math.abs(supportElbow.x - supportShoulder.x) < elbowAlignmentThreshold;

      const feetStacked = (leftAnkle && rightAnkle) ? (Math.abs(leftAnkle.x - rightAnkle.x) < (spConfig.FEET_STACKING_THRESHOLD || 0.12)) : true;

      let headNeckGood = true;
      if (supportEar && vis(supportEar)) {
        const headNeckAngle = this.calculateAngle(supportEar, supportShoulder, supportHip);
        const HEAD_NECK_ANGLE_MIN = spConfig.HEAD_NECK_ANGLE_MIN || 150;
        const HEAD_NECK_ANGLE_MAX = spConfig.HEAD_NECK_ANGLE_MAX || 200;
        headNeckGood = headNeckAngle >= HEAD_NECK_ANGLE_MIN && headNeckAngle <= HEAD_NECK_ANGLE_MAX;
      }

      const isGoodPosture = shoulderAngleGood && torsoAngleGood && !hipSag && !hipHike && elbowAligned && feetStacked && headNeckGood;

      console.log('🔍 Knee Plank Debug:', { side: isLeftSide ? 'Left' : 'Right', shoulderSupportAngle: Math.round(shoulderSupportAngle), torsoHipAngle: Math.round(torsoHipAngle), hipSag, hipHike, elbowAligned, feetStacked, isGoodPosture, postureStatus: this.postureStatus });

      if (isGoodPosture) {
        this._postureGoodCount = (this._postureGoodCount || 0) + 1;
        this._postureBadCount = 0;
      } else {
        this._postureBadCount = (this._postureBadCount || 0) + 1;
        this._postureGoodCount = 0;
      }

      const POSTURE_GOOD_FRAMES = spConfig.POSTURE_GOOD_FRAMES || 3;
      const POSTURE_BAD_FRAMES = spConfig.POSTURE_BAD_FRAMES || 4;

      let smoothedStatus = this.postureStatus;
      if (this._postureGoodCount >= POSTURE_GOOD_FRAMES) {
        smoothedStatus = 'correct';
      } else if (this._postureBadCount >= POSTURE_BAD_FRAMES) {
        smoothedStatus = 'incorrect';
      }

      if (smoothedStatus !== this.postureStatus) {
        this.postureStatus = smoothedStatus;
        if (this.onPostureChange) this.onPostureChange(this.postureStatus, landmarks);
      }

      // Timing like plank
      if (this.postureStatus === 'correct') {
        const now = Date.now();
        if (!this.timerRunning) {
          this.startCorrectTimestampMs = now;
          this.timerRunning = true;
        }
        const totalMs = this.accumulatedCorrectMs + (now - (this.startCorrectTimestampMs || now));
        const seconds = Math.floor(totalMs / 1000);
        if (this.onTimeUpdate) this.onTimeUpdate(seconds);
      } else {
        if (this.timerRunning) {
          this.accumulatedCorrectMs += Date.now() - this.startCorrectTimestampMs;
          this.timerRunning = false;
          this.startCorrectTimestampMs = 0;
          if (this.onTimeUpdate) {
            this.onTimeUpdate(Math.floor(this.accumulatedCorrectMs / 1000));
          }
        }
      }

      if (!isGoodPosture && this.onFormFeedback) {
        const currentTime = Date.now();
        const cooldown = spConfig.WARNING_COOLDOWN || 2000;
        if (currentTime - this.lastWarningTime > cooldown) {
          let feedbackMessage = '';
          if (hipSag) feedbackMessage = 'Hip sagging - lift your hips up!';
          else if (hipHike) feedbackMessage = 'Hip too high - lower your hips!';
          else if (!elbowAligned) feedbackMessage = 'Keep elbow under shoulder!';
          else if (!feetStacked) feedbackMessage = 'Stack your feet together!';
          else if (!shoulderAngleGood) feedbackMessage = 'Adjust your arm position!';
          else if (!torsoAngleGood) feedbackMessage = 'Keep your body straight!';

          if (feedbackMessage) {
            this.onFormFeedback({ message: feedbackMessage, type: 'warning', timestamp: currentTime });
            this.lastWarningTime = currentTime;
          }
        }
      }

    } catch (error) {
      console.error('Error updating knee plank counter:', error);
    }
  }

  // reverse plank removed
  playWarningSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing warning sound:', error);
    }
  }

  // Play success sound (pop.wav)
  playSuccessSound() {
    try {
      const audio = new Audio('/assets/sounds/pop.wav');
      audio.volume = 0.5; // Set volume to 50%
      audio.play().catch(error => {
        console.error('Error playing success sound:', error);
      });
    } catch (error) {
      console.error('Error creating success sound:', error);
    }
  }

  // Draw pose landmarks on canvas
  drawPoseOverlay(canvasCtx, results, canvasWidth, canvasHeight, transform = null) {
    // Always log to help debug landmark visibility
    console.log('🎨 Drawing pose overlay with', results.poseLandmarks?.length || 0, 'landmarks');

    if (!results.poseLandmarks || !canvasCtx) {
      console.log('❌ No landmarks or canvas context available');
      return;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw landmarks
    const landmarks = results.poseLandmarks;
    let drawnLandmarks = 0;

    landmarks.forEach((landmark, index) => {
      if (landmark.visibility && landmark.visibility > 0.3) {
        let x, y;
        
        if (transform) {
          // MediaPipe landmarks are normalized (0-1), so we scale directly
          x = (landmark.x * transform.scaleX) + transform.offsetX;
          y = (landmark.y * transform.scaleY) + transform.offsetY;
        } else {
          // Fallback to simple scaling
          x = landmark.x * canvasWidth;
          y = landmark.y * canvasHeight;
        }

        // Enhanced landmark styling with professional gradient and shadow effects
        const radius = landmark.visibility > 0.9 ? 12 : 
                      landmark.visibility > 0.7 ? 10 : 
                      landmark.visibility > 0.5 ? 8 : 6;
        const shadowBlur = 6;
        
        // Draw outer glow effect first
        canvasCtx.save();
        canvasCtx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        canvasCtx.shadowBlur = shadowBlur * 1.5;
        canvasCtx.shadowOffsetX = 0;
        canvasCtx.shadowOffsetY = 0;
        
        // Create professional radial gradient for landmark
        const gradient = canvasCtx.createRadialGradient(x, y, 0, x, y, radius);
        
        // Professional color scheme based on visibility and confidence
        if (landmark.visibility > 0.9) {
          // High confidence - professional emerald gradient
          gradient.addColorStop(0, '#A7F3D0');   // Light emerald center
          gradient.addColorStop(0.4, '#34D399'); // Bright emerald
          gradient.addColorStop(0.8, '#10B981'); // Rich emerald
          gradient.addColorStop(1, '#047857');   // Deep emerald edge
        } else if (landmark.visibility > 0.8) {
          // Good confidence - professional blue gradient
          gradient.addColorStop(0, '#DBEAFE');   // Light blue center
          gradient.addColorStop(0.4, '#93C5FD'); // Sky blue
          gradient.addColorStop(0.8, '#3B82F6'); // Bright blue
          gradient.addColorStop(1, '#1E40AF');   // Deep blue edge
        } else if (landmark.visibility > 0.7) {
          // Medium confidence - professional amber gradient
          gradient.addColorStop(0, '#FEF3C7');   // Light amber center
          gradient.addColorStop(0.4, '#FCD34D'); // Bright amber
          gradient.addColorStop(0.8, '#F59E0B'); // Rich amber
          gradient.addColorStop(1, '#D97706');   // Deep amber edge
        } else if (landmark.visibility > 0.5) {
          // Lower confidence - professional rose gradient
          gradient.addColorStop(0, '#FCE7F3');   // Light rose center
          gradient.addColorStop(0.4, '#F9A8D4'); // Bright rose
          gradient.addColorStop(0.8, '#EC4899'); // Rich rose
          gradient.addColorStop(1, '#BE185D');   // Deep rose edge
        } else {
          // Very low confidence - bright yellow gradient for visibility
          gradient.addColorStop(0, '#FEF9C3');   // Light yellow center
          gradient.addColorStop(0.4, '#FDE047'); // Bright yellow
          gradient.addColorStop(0.8, '#EAB308'); // Rich yellow
          gradient.addColorStop(1, '#CA8A04');   // Deep yellow edge
        }
        
        // Draw the main landmark circle with professional styling
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, radius, 0, 2 * Math.PI);
        canvasCtx.fillStyle = gradient;
        canvasCtx.fill();
        
        canvasCtx.restore();
        
        // Add professional white border with subtle shadow
        canvasCtx.save();
        canvasCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        canvasCtx.shadowBlur = 3;
        canvasCtx.shadowOffsetX = 1;
        canvasCtx.shadowOffsetY = 1;
        
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, radius, 0, 2 * Math.PI);
        canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
        canvasCtx.restore();
        
        // Add inner highlight for premium 3D effect
        const highlightRadius = radius * 0.35;
        const highlightGradient = canvasCtx.createRadialGradient(
          x - highlightRadius, y - highlightRadius, 0,
          x - highlightRadius, y - highlightRadius, highlightRadius
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        canvasCtx.beginPath();
        canvasCtx.arc(x - highlightRadius * 0.5, y - highlightRadius * 0.5, highlightRadius, 0, 2 * Math.PI);
        canvasCtx.fillStyle = highlightGradient;
        canvasCtx.fill();
        
        drawnLandmarks++;
      }
    });

    // Only log occasionally
    if (Math.random() < 0.1) {
      console.log('✨ Drew', drawnLandmarks, 'landmarks');
    }

    // Add pulse animation effect for high-confidence landmarks
    this.addPulseEffect(canvasCtx, landmarks, canvasWidth, canvasHeight, transform);

    // Always use basic connections (more reliable)
    this.drawBasicConnections(canvasCtx, landmarks, canvasWidth, canvasHeight, transform);

    // Add confidence indicator overlay
    this.drawConfidenceIndicator(canvasCtx, landmarks, canvasWidth, canvasHeight);

    // Draw sit-ups debug overlay if available
    try {
      const stateObj = this.perModeState && this.perModeState['situps'];
      if (stateObj && stateObj._debug) {
        const d = stateObj._debug;
        const lines = [
          `situps: count=${stateObj.count} state=${stateObj.state}`,
          `hipAngle=${d.avgHipAngle != null ? d.avgHipAngle.toFixed(1) : 'n/a'}`,
          `kneeAngle=${d.avgKneeAngle != null ? d.avgKneeAngle.toFixed(1) : 'n/a'}`,
          `noseDy=${d.noseDy != null ? d.noseDy.toFixed(3) : 'n/a'}`,
          `rotDeg=${d.combinedRotDeg != null ? d.combinedRotDeg.toFixed(1) : 'n/a'}`,
          `pending=${d.pending} src=${d.pendingSource}`
        ];

        canvasCtx.save();
        canvasCtx.font = '16px monospace';
        canvasCtx.fillStyle = 'rgba(0,0,0,0.6)';
        canvasCtx.fillRect(8, 8, 260, (lines.length * 18) + 8);
        canvasCtx.fillStyle = '#FFFFFF';
        for (let i = 0; i < lines.length; i++) {
          canvasCtx.fillText(lines[i], 12, 26 + (i * 18));
        }
        canvasCtx.restore();
      }
    } catch (e) {
      // ignore overlay errors
    }

    canvasCtx.restore();
  }

  // Draw basic pose connections
  drawBasicConnections(canvasCtx, landmarks, canvasWidth, canvasHeight, transform = null) {
    const connections = [
      [11, 12], // shoulders
      [11, 13], // left shoulder to elbow
      [13, 15], // left elbow to wrist
      [12, 14], // right shoulder to elbow
      [14, 16], // right elbow to wrist
      [11, 23], // left shoulder to hip
      [12, 24], // right shoulder to hip
      [23, 24], // hips
      [23, 25], // left hip to knee
      [25, 27], // left knee to ankle
      [24, 26], // right hip to knee
      [26, 28]  // right knee to ankle
    ];

    // Define connection types for different styling
    const connectionTypes = {
      torso: [[11, 12], [11, 23], [12, 24], [23, 24]], // Core body connections
      arms: [[11, 13], [13, 15], [12, 14], [14, 16]], // Arm connections
      legs: [[23, 25], [25, 27], [24, 26], [26, 28]]  // Leg connections
    };

    let drawnConnections = 0;
    connections.forEach(([startIdx, endIdx]) => {
      const startPoint = landmarks[startIdx];
      const endPoint = landmarks[endIdx];

      if (startPoint && endPoint &&
        startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
        
        let startX, startY, endX, endY;
        
        if (transform) {
          // MediaPipe landmarks are normalized (0-1), so we scale directly
          startX = (startPoint.x * transform.scaleX) + transform.offsetX;
          startY = (startPoint.y * transform.scaleY) + transform.offsetY;
          endX = (endPoint.x * transform.scaleX) + transform.offsetX;
          endY = (endPoint.y * transform.scaleY) + transform.offsetY;
        } else {
          // Fallback to simple scaling
          startX = startPoint.x * canvasWidth;
          startY = startPoint.y * canvasHeight;
          endX = endPoint.x * canvasWidth;
          endY = endPoint.y * canvasHeight;
        }
        
        // Determine connection type and styling with professional color scheme
        let connectionColor, lineWidth, shadowColor, glowColor;
        const connection = [startIdx, endIdx];
        
        if (connectionTypes.torso.some(([s, e]) => (s === startIdx && e === endIdx) || (s === endIdx && e === startIdx))) {
          // Torso connections - professional blue gradient
          connectionColor = '#3B82F6';
          glowColor = '#60A5FA';
          lineWidth = 6;
          shadowColor = 'rgba(59, 130, 246, 0.5)';
        } else if (connectionTypes.arms.some(([s, e]) => (s === startIdx && e === endIdx) || (s === endIdx && e === startIdx))) {
          // Arm connections - professional green gradient
          connectionColor = '#10B981';
          glowColor = '#34D399';
          lineWidth = 5;
          shadowColor = 'rgba(16, 185, 129, 0.5)';
        } else if (connectionTypes.legs.some(([s, e]) => (s === startIdx && e === endIdx) || (s === endIdx && e === startIdx))) {
          // Leg connections - professional purple gradient
          connectionColor = '#8B5CF6';
          glowColor = '#A78BFA';
          lineWidth = 5;
          shadowColor = 'rgba(139, 92, 246, 0.5)';
        } else {
          // Default styling - professional gray gradient
          connectionColor = '#6B7280';
          glowColor = '#9CA3AF';
          lineWidth = 4;
          shadowColor = 'rgba(107, 114, 128, 0.4)';
        }

        // Create professional linear gradient for the connection line
        const gradient = canvasCtx.createLinearGradient(startX, startY, endX, endY);
        const avgVisibility = (startPoint.visibility + endPoint.visibility) / 2;
        
        if (avgVisibility > 0.9) {
          // High confidence - rich gradient with glow
          gradient.addColorStop(0, glowColor);
          gradient.addColorStop(0.3, connectionColor);
          gradient.addColorStop(0.7, connectionColor);
          gradient.addColorStop(1, glowColor);
        } else if (avgVisibility > 0.8) {
          // Good confidence - solid gradient
          gradient.addColorStop(0, connectionColor);
          gradient.addColorStop(0.5, connectionColor + 'DD');
          gradient.addColorStop(1, connectionColor);
        } else if (avgVisibility > 0.7) {
          // Medium confidence - semi-transparent gradient
          gradient.addColorStop(0, connectionColor + 'CC');
          gradient.addColorStop(0.5, connectionColor + '99');
          gradient.addColorStop(1, connectionColor + 'CC');
        } else {
          // Lower confidence - more transparent gradient
          gradient.addColorStop(0, connectionColor + '99');
          gradient.addColorStop(0.5, connectionColor + '66');
          gradient.addColorStop(1, connectionColor + '99');
        }

        // Draw professional shadow/glow effect
        canvasCtx.save();
        canvasCtx.shadowColor = shadowColor;
        canvasCtx.shadowBlur = 12; // Enhanced glow effect
        canvasCtx.shadowOffsetX = 0;
        canvasCtx.shadowOffsetY = 0;
        
        // Draw the main connection line with professional styling
        canvasCtx.beginPath();
        canvasCtx.moveTo(startX, startY);
        canvasCtx.lineTo(endX, endY);
        canvasCtx.strokeStyle = gradient;
        canvasCtx.lineWidth = lineWidth;
        canvasCtx.lineCap = 'round'; // Rounded line caps for professional appearance
        canvasCtx.lineJoin = 'round'; // Rounded line joins for smooth connections
        canvasCtx.stroke();
        
        canvasCtx.restore();
        
        // Add subtle inner highlight for premium depth
        canvasCtx.save();
        canvasCtx.beginPath();
        canvasCtx.moveTo(startX, startY);
        canvasCtx.lineTo(endX, endY);
        canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        canvasCtx.lineWidth = 1;
        canvasCtx.lineCap = 'round';
        canvasCtx.stroke();
        canvasCtx.restore();
        
        drawnConnections++;
      }
    });

    // Only log occasionally
    if (Math.random() < 0.02) {
      console.log('✅ Drawing completed!', drawnConnections, 'connections');
    }
  }

  // Add professional pulse animation effect for high-confidence landmarks
  addPulseEffect(canvasCtx, landmarks, canvasWidth, canvasHeight, transform = null) {
    if (!landmarks) return;
    
    const currentTime = Date.now();
    const pulseSpeed = 0.002; // Slower, more professional pulse
    const pulseIntensity = Math.sin(currentTime * pulseSpeed) * 0.5 + 0.5; // 0 to 1
    
    landmarks.forEach((landmark, index) => {
      if (landmark.visibility && landmark.visibility > 0.9) { // Only very high-confidence landmarks
        let x, y;
        
        if (transform) {
          x = (landmark.x * transform.scaleX) + transform.offsetX;
          y = (landmark.y * transform.scaleY) + transform.offsetY;
        } else {
          x = landmark.x * canvasWidth;
          y = landmark.y * canvasHeight;
        }

        // Create professional pulsing outer ring
        const pulseRadius = 14 + (pulseIntensity * 8); // Varies from 14 to 22
        const pulseAlpha = 0.4 - (pulseIntensity * 0.25); // Fades as it expands
        const pulseWidth = 3 - (pulseIntensity * 1); // Gets thinner as it expands
        
        canvasCtx.save();
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
        canvasCtx.strokeStyle = `rgba(52, 211, 153, ${pulseAlpha})`; // Professional green pulse
        canvasCtx.lineWidth = pulseWidth;
        canvasCtx.stroke();
        
        // Add inner glow ring for premium effect
        const innerRadius = pulseRadius - 4;
        const innerAlpha = pulseAlpha * 0.7;
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, innerRadius, 0, 2 * Math.PI);
        canvasCtx.strokeStyle = `rgba(167, 243, 208, ${innerAlpha})`; // Light emerald inner glow
        canvasCtx.lineWidth = 1;
        canvasCtx.stroke();
        
        canvasCtx.restore();
        canvasCtx.restore();
      }
    });
  }

  // Draw professional confidence indicator overlay
  drawConfidenceIndicator(canvasCtx, landmarks, canvasWidth, canvasHeight) {
    if (!landmarks) return;
    
    // Calculate overall pose confidence
    const visibleLandmarks = landmarks.filter(l => l.visibility > 0.5);
    const avgConfidence = visibleLandmarks.length > 0 
      ? visibleLandmarks.reduce((sum, l) => sum + l.visibility, 0) / visibleLandmarks.length 
      : 0;
    
    // Professional confidence indicator in top-right corner
    const barWidth = 140;
    const barHeight = 10;
    const barX = canvasWidth - barWidth - 25;
    const barY = 25;
    const cornerRadius = 5;
    
    canvasCtx.save();
    
    // Professional background with subtle shadow
    canvasCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    canvasCtx.shadowBlur = 6;
    canvasCtx.shadowOffsetX = 0;
    canvasCtx.shadowOffsetY = 2;
    
    // Background bar with rounded corners
    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    canvasCtx.beginPath();
    canvasCtx.roundRect(barX, barY, barWidth, barHeight, cornerRadius);
    canvasCtx.fill();
    
    // Confidence fill with professional gradient
    const fillWidth = barWidth * avgConfidence;
    let fillColor, gradientColor;
    
    if (avgConfidence > 0.85) {
      fillColor = '#10B981'; // Professional emerald green
      gradientColor = '#34D399';
    } else if (avgConfidence > 0.65) {
      fillColor = '#F59E0B'; // Professional amber
      gradientColor = '#FCD34D';
    } else {
      fillColor = '#EF4444'; // Professional red
      gradientColor = '#F87171';
    }
    
    // Create professional gradient fill
    const fillGradient = canvasCtx.createLinearGradient(barX, barY, barX, barY + barHeight);
    fillGradient.addColorStop(0, gradientColor);
    fillGradient.addColorStop(1, fillColor);
    
    canvasCtx.fillStyle = fillGradient;
    canvasCtx.beginPath();
    canvasCtx.roundRect(barX, barY, fillWidth, barHeight, cornerRadius);
    canvasCtx.fill();
    
    // Professional border
    canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.roundRect(barX, barY, barWidth, barHeight, cornerRadius);
    canvasCtx.stroke();
    
    // Professional confidence text
    canvasCtx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    canvasCtx.fillStyle = '#FFFFFF';
    canvasCtx.textAlign = 'right';
    canvasCtx.textBaseline = 'bottom';
    canvasCtx.fillText(`Pose: ${Math.round(avgConfidence * 100)}%`, barX + barWidth, barY - 8);
    
    // Add confidence level indicator
    let confidenceLevel;
    if (avgConfidence > 0.85) confidenceLevel = 'Excellent';
    else if (avgConfidence > 0.65) confidenceLevel = 'Good';
    else confidenceLevel = 'Low';
    
    canvasCtx.font = '10px system-ui, -apple-system, sans-serif';
    canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    canvasCtx.textAlign = 'right';
    canvasCtx.fillText(confidenceLevel, barX + barWidth, barY + barHeight + 14);
    
    canvasCtx.restore();
  }

  // Reset counter
  resetCounter() {
    // Reset only the counters/state for the currently selected exercise
    const mode = this.exerciseMode;
    if (this.perModeState && this.perModeState[mode]) {
      this.perModeState[mode].count = 0;
      this.perModeState[mode].state = 'up';
      // reset mode-specific extras
      if (mode === 'mountainclimbers') {
        this.perModeState[mode]._lastLeftKneeY = null;
        this.perModeState[mode]._lastRightKneeY = null;
        this.perModeState[mode]._climberState = 'neutral';
        this.perModeState[mode]._lastClimberTime = 0;
      }
      if (mode === 'situps') {
        this.perModeState[mode]._lastRepAt = 0;
        this.perModeState[mode]._stableCount = 0;
      }
      if (mode === 'burpees') {
        this.perModeState[mode]._burpeeState = 'ready';
      }
      if (mode === 'jumpingjacks') {
        this.perModeState[mode]._lastRepAt = 0;
        this.perModeState[mode]._upCount = 0;
        this.perModeState[mode]._downCount = 0;
        this.perModeState[mode]._baselineAnkleDist = null;
        this.perModeState[mode]._upSince = 0;
        this.perModeState[mode]._ignoreUntil = 0;
      }
      if (mode === 'sideplank') {
        // Reset side plank state
        this.perModeState[mode].state = 'neutral';
        this.perModeState[mode].count = 0;
      }
      if (mode === 'straightarmplank') {
        // Reset straight arm plank state (time-based like sideplank)
        this.perModeState[mode].state = 'neutral';
        this.perModeState[mode].count = 0;
      }
      if (mode === 'reversestraightarmplank') {
        // Reset reverse straight arm plank state (time-based like sideplank)
        this.perModeState[mode].state = 'neutral';
        this.perModeState[mode].count = 0;
      }
      if (mode === 'kneeplank') {
        // Reset knee plank state (time-based like sideplank)
        this.perModeState[mode].state = 'neutral';
        this.perModeState[mode].count = 0;
      }

      if (mode === 'plank') {
        // Reset plank stability/timing helpers
        this.perModeState[mode]._stableCount = 0;
        this.perModeState[mode]._lastHipY = null;
        this.perModeState[mode]._lastShoulderY = null;
        this.perModeState[mode]._lastAnkleY = null;
        this.perModeState[mode]._lastTimestamp = 0;
      }
    }
    this.postureStatus = 'unknown';
    // Reset plank timing
    this.accumulatedCorrectMs = 0;
    this.timerRunning = false;
    this.startCorrectTimestampMs = 0;
  }

  // Get current stats
  getStats() {
    const mode = this.exerciseMode;
    const stateObj = this.perModeState && this.perModeState[mode] ? this.perModeState[mode] : { count: 0, state: 'up' };
    return {
      count: stateObj.count || 0,
      state: stateObj.state || 'up',
      posture: this.postureStatus,
      timeSec: Math.floor((this.accumulatedCorrectMs + (this.timerRunning ? (Date.now() - this.startCorrectTimestampMs) : 0)) / 1000)
    };
  }

  // Get latest pose results for drawing
  getLastResults() {
    return this.lastResults;
  }

  // Set callback functions
  setCallbacks({ onPushupCount, onPostureChange, onFormFeedback, onTimeUpdate }) {
    this.onPushupCount = onPushupCount;
    this.onPostureChange = onPostureChange;
    this.onFormFeedback = onFormFeedback;
    this.onTimeUpdate = onTimeUpdate;
    console.debug('PoseDetectionUtils: setCallbacks assigned', {
      hasOnPushupCount: !!onPushupCount,
      hasOnPostureChange: !!onPostureChange,
      hasOnFormFeedback: !!onFormFeedback,
      hasOnTimeUpdate: !!onTimeUpdate
    });
  }

  // Cleanup
  cleanup() {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.isInitialized = false;
  }
}

export default PoseDetectionUtils;
