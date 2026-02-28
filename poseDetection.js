// Pose detection utilities using MediaPipe
class PoseDetectionUtils {
  constructor() {
    this.pose = null;
    this.isInitialized = false;
  // Per-exercise state to avoid cross-contamination between different exercises
  // Structure: { <mode>: { state: 'up'|'down'|'neutral'|..., count: number, extra... } }
  this.perModeState = {};
  const initMode = (mode) => ({ state: 'up', count: 0 });
  this.perModeState['pushups'] = initMode('pushups');
  this.perModeState['squats'] = initMode('squats');
  this.perModeState['lunges'] = initMode('lunges');
  this.perModeState['burpees'] = initMode('burpees');
  this.perModeState['situps'] = { state: 'down', count: 0 };
  this.perModeState['mountainclimbers'] = { state: 'neutral', count: 0, _lastLeftKneeY: null, _lastRightKneeY: null, _climberState: 'neutral', _lastClimberTime: 0 };
  this.perModeState['highknees'] = { state: 'down', count: 0 };
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
  }

  setExerciseMode(mode) {
    // ensure perModeState exists for the selected mode
    if (!this.perModeState[this.exerciseMode]) {
      this.perModeState[this.exerciseMode] = { state: 'up', count: 0 };
    }
    const normalized = String(mode || '').toLowerCase();
    if (normalized.includes('plank')) this.exerciseMode = 'plank';
    else if (normalized === 'squats' || normalized === 'squat') this.exerciseMode = 'squats';
    else if (normalized === 'lunges' || normalized === 'lunge') this.exerciseMode = 'lunges';
    else if (normalized === 'burpees' || normalized === 'burpee') this.exerciseMode = 'burpees';
    else if (normalized.includes('mountain') || normalized.includes('climber')) this.exerciseMode = 'mountainclimbers';
    else if (normalized.includes('high') && normalized.includes('knees')) this.exerciseMode = 'highknees';
    else if (normalized.includes('situp')) this.exerciseMode = 'situps';
    else this.exerciseMode = 'pushups';
  }

  // Initialize MediaPipe Pose
  async initialize() {
    try {
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

      this.pose = new window.Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
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

  // Process video frame
  async processFrame(videoElement) {
    if (!this.isInitialized || !this.pose) {
      console.log('❌ Pose not initialized or missing');
      return null;
    }

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
      
      await this.pose.send({ image: videoElement });
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
    
    // Evaluate posture for the current exercise using the unified checker.
    // Use a short consecutive-frame smoothing window to avoid brief spikes flipping posture state
    const isPostureCorrectInstant = this.checkBackAlignment(landmarks);

    // Initialize counters if missing
    if (this._postureGoodCount == null) this._postureGoodCount = 0;
    if (this._postureBadCount == null) this._postureBadCount = 0;

    if (isPostureCorrectInstant) {
      this._postureGoodCount += 1;
      this._postureBadCount = 0;
    } else {
      this._postureBadCount += 1;
      this._postureGoodCount = 0;
    }

  const POSTURE_GOOD_FRAMES = window.MediaPipeConfig?.SQUAT_CONFIG?.POSTURE_GOOD_FRAMES ?? 3;
  // For squats we require more consecutive bad frames before flipping to 'incorrect' to avoid
  // false positives during normal descent. Default to 6 for squats, 4 otherwise.
  const POSTURE_BAD_FRAMES = (this.exerciseMode === 'squats') ? (window.MediaPipeConfig?.SQUAT_CONFIG?.POSTURE_BAD_FRAMES ?? 6) : (window.MediaPipeConfig?.SQUAT_CONFIG?.POSTURE_BAD_FRAMES ?? 4);

    let smoothedStatus = this.postureStatus;
    if (this._postureGoodCount >= POSTURE_GOOD_FRAMES) {
      smoothedStatus = 'correct';
    } else if (this._postureBadCount >= POSTURE_BAD_FRAMES) {
      smoothedStatus = 'incorrect';
    }

    // For squats we don't want to show poor/incorrect posture feedback — treat as correct.
    if (this.exerciseMode === 'squats') {
      smoothedStatus = 'correct';
    }

    if (smoothedStatus !== this.postureStatus) {
      this.postureStatus = smoothedStatus;
      if (this.onPostureChange) this.onPostureChange(this.postureStatus, landmarks);
    }

    // If posture is incorrect for strength/technique exercises, warn and normally skip counting.
    // However, allow deep squat descents (hip below knee) to proceed to the squat counter so
    // counting can occur if legs are stable. The squat counter itself still enforces stability
    // and collapse checks.
    const cardioExercises = ['mountainclimbers', 'highknees'];

    // Compute hip/knee centers to detect a deep squat descent (hip below knee)
    const cfg = window.MediaPipeConfig?.POSE_LANDMARKS || {};
    const leftHip = landmarks[cfg.LEFT_HIP || 23];
    const rightHip = landmarks[cfg.RIGHT_HIP || 24];
    const leftKnee = landmarks[cfg.LEFT_KNEE || 25];
    const rightKnee = landmarks[cfg.RIGHT_KNEE || 26];
    const hipCenter = leftHip && rightHip ? { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 } : null;
    const kneeCenter = leftKnee && rightKnee ? { x: (leftKnee.x + rightKnee.x) / 2, y: (leftKnee.y + rightKnee.y) / 2 } : null;
    const hipBelowKnee = hipCenter && kneeCenter ? (hipCenter.y > kneeCenter.y) : false;

  // Do not emit posture warnings or block counting for squats; allow squat-specific logic to handle counting.
  if (this.postureStatus !== 'correct' && !cardioExercises.includes(this.exerciseMode) && this.exerciseMode !== 'squats') {
      const currentTime = Date.now();
      const cooldown = window.MediaPipeConfig?.PLANK_CONFIG?.WARNING_COOLDOWN || 2000;

      if (currentTime - this.lastWarningTime > cooldown) {
        this.playWarningSound();
        this.lastWarningTime = currentTime;

        if (this.onFormFeedback) {
          this.onFormFeedback({
            message: "Dangerous posture - straighten your back!",
            type: "warning",
            timestamp: currentTime
          });
        }
      }

      // Stop plank timer while incorrect
      if (this.exerciseMode === 'plank' && this.timerRunning) {
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

    // Posture is correct
    if (this.exerciseMode === 'plank') {
      const now = Date.now();
      if (!this.timerRunning) {
        this.startCorrectTimestampMs = now;
        this.timerRunning = true;
      }
      const totalMs = this.accumulatedCorrectMs + (now - (this.startCorrectTimestampMs || now));
      const seconds = Math.floor(totalMs / 1000);
      if (this.onTimeUpdate) this.onTimeUpdate(seconds);
      return;
    }

    // Count reps depending on mode
      if (this.exerciseMode === 'squats') {
        this.updateSquatCounter(landmarks);
      } else if (this.exerciseMode === 'lunges') {
        this.updateLungesCounter(landmarks);
      } else if (this.exerciseMode === 'burpees') {
        this.updateBurpeesCounter(landmarks);
      } else if (this.exerciseMode === 'mountainclimbers') {
        this.updateMountainClimbersCounter(landmarks);
      } else if (this.exerciseMode === 'highknees') {
        this.updateHighKneesCounter(landmarks);
      } else if (this.exerciseMode === 'jumpingjacks') {
       this.updateJumpingJacksCounter(landmarks);
      } else if (this.exerciseMode === 'situps') {
        this.updateSitupCounter(landmarks);
      } else {
        this.updatePushupCounter(landmarks);
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

  // Check back alignment for posture
  checkBackAlignment(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      
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
      if (this.exerciseMode === 'plank') {
        const leftSideOk = vis(leftShoulder) && vis(leftHip);
        const rightSideOk = vis(rightShoulder) && vis(rightHip);
        if (!leftSideOk && !rightSideOk) {
          // Not enough landmarks to evaluate plank reliably
          return false;
        }
      } else if (this.exerciseMode === 'pushups') {
        // For push-ups we only require both shoulders and hips to be visible.
        if (!vis(leftShoulder) || !vis(rightShoulder) || !vis(leftHip) || !vis(rightHip)) {
          return false;
        }
      } else {
        // For other exercises require knees visible for stability
        if (!vis(leftShoulder) || !vis(rightShoulder) || !vis(leftHip) || !vis(rightHip) || !vis(leftKnee) || !vis(rightKnee)) {
          return false;
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

      // Vectors for straightness
      const targetPoint = ankleCenter || kneeCenter;
      const v1 = { x: shoulderCenter.x - hipCenter.x, y: shoulderCenter.y - hipCenter.y };
      const v2 = targetPoint ? { x: targetPoint.x - hipCenter.x, y: targetPoint.y - hipCenter.y } : null;

      let isGoodPosture = false;
      if (this.exerciseMode === 'plank') {
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

          isGoodPosture = sideAngle >= minSideAngle;

          // optional knee check when both ankles visible
          if (isGoodPosture && ankleCenter) {
            const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
            const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
            const kneeMin = cfg.KNEE_MIN_DEG ?? 150;
            const kneeOk = (leftKneeAngle >= kneeMin) && (rightKneeAngle >= kneeMin);
            isGoodPosture = isGoodPosture && kneeOk;
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
          isGoodPosture = straightEnough && nearHorizontal && kneeOk;
        }

      } else if (this.exerciseMode === 'squats') {
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
          isGoodPosture = false;
        } else if (hipBelowKnee) {
          // Normal squat descent — accept as good (as long as collapse not detected)
          isGoodPosture = true;
        } else {
          // Standing/upright checks: require reasonable hip angle and torso tilt
          isGoodPosture = (hipAngle >= hipAngleMin) && (torsoTiltDeg <= tiltMax);
        }
      } else {
        // Push-ups: prefer a dedicated horizontal-body check.
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
          isGoodPosture = absCos >= SIDE_ABS_COS_MIN;
        } else {
          // Fallback: check that shoulder-hip axis is near horizontal (small dy)
          const dx = shoulderCenter.x - hipCenter.x;
          const dy = shoulderCenter.y - hipCenter.y;
          const angDeg = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
          // angle near 0 or near 180 -> horizontal
          const nearHorizontal = (angDeg <= HORIZ_TORSO_MAX_DEG) || (angDeg >= (180 - HORIZ_TORSO_MAX_DEG));
          // Also ensure it's not standing (i.e., torso nearly vertical)
          const nearVertical = (angDeg >= 90 - 20 && angDeg <= 90 + 20);
          isGoodPosture = nearHorizontal && !nearVertical;
        }
      }

      console.log(`🏃 Posture(${this.exerciseMode}): ${isGoodPosture ? 'GOOD' : 'BAD'}`);
      
      return isGoodPosture;
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

  // Update squat counter
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
      const stateObj = this.perModeState['squats'];

      // Debug logging
      console.log('🔍 Squat Debug:', {
        legsStable,
        kneesBending,
        avgKneeAngle,
        kneeHeightDiff,
        hipBelowKnee,
        hipAboveKnee,
        state: stateObj.state,
        count: stateObj.count
      });

      // Simplified squat counting: count when hips go below knees with stable legs
      const MIN_REP_MS = window.MediaPipeConfig?.SQUAT_CONFIG?.MIN_REP_MS ?? 500;
      if (!stateObj._lastRepAt) stateObj._lastRepAt = 0;
      const now = Date.now();

      if (stateObj.state === 'up') {
        // Count if hips go below knees and legs are stable, and NOT in horizontal position or hands on ground
        if (hipBelowKnee && legsStable && !isHorizontalLikePushup && !handsOnGround && (now - stateObj._lastRepAt) > MIN_REP_MS) {
          stateObj.state = 'down';
          stateObj.count += 1;
          stateObj._lastRepAt = now;
          console.log('🎯 Squat counted! Count:', stateObj.count);
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
          console.log('⬆️ Squat state changed to UP');
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

  updateJumpingJacksCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const jjConfig = window.MediaPipeConfig?.JUMPINGJACKS_CONFIG || {};

      // Get key landmarks for jumping jacks
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];
      const leftKnee = landmarks[config.LEFT_KNEE || 25];
      const rightKnee = landmarks[config.RIGHT_KNEE || 26];
      const leftElbow = landmarks[config.LEFT_ELBOW || 13];
      const rightElbow = landmarks[config.RIGHT_ELBOW || 14];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftAnkle = landmarks[config.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[config.RIGHT_ANKLE || 28];

      if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftKnee || !rightKnee || !leftElbow || !rightElbow || !leftWrist || !rightWrist || !leftAnkle || !rightAnkle) {
        return;
      }

      // Calculate shoulder abduction angles (shoulder-elbow-wrist) - arms overhead
      const leftShoulderAbduction = this.calculateAngle(leftElbow, leftShoulder, leftWrist);
      const rightShoulderAbduction = this.calculateAngle(rightElbow, rightShoulder, rightWrist);

      // Calculate hip abduction angles (hip-knee-ankle) - legs apart
      const leftHipAbduction = this.calculateAngle(leftKnee, leftHip, leftAnkle);
      const rightHipAbduction = this.calculateAngle(rightKnee, rightHip, rightAnkle);

      // Calculate knee flexion angles (hip-knee-ankle)
      const leftKneeFlexion = this.calculateAngle(leftHip, leftKnee, leftAnkle);
      const rightKneeFlexion = this.calculateAngle(rightHip, rightKnee, rightAnkle);

      // Stricter thresholds and robust UP->DOWN detection to match pose breakdown
  const SHOULDER_ABDUCTION_DOWN = jjConfig.SHOULDER_ABDUCTION_DOWN || 40;
  // slightly relaxed peak requirement for rotation tolerance
  const SHOULDER_ABDUCTION_UP = jjConfig.SHOULDER_ABDUCTION_UP || 145;
  const HIP_ABDUCTION_DOWN = jjConfig.HIP_ABDUCTION_DOWN || 12;
  const HIP_ABDUCTION_UP = jjConfig.HIP_ABDUCTION_UP || 32;

      // Timing and smoothing
  const MIN_REP_MS = jjConfig.MIN_REP_MS || 800; // increase debounce to avoid double counts
  const UP_FRAMES = jjConfig.UP_FRAMES || 2;
  const DOWN_FRAMES = jjConfig.DOWN_FRAMES || 3; // require more stable down confirmation
      const ANKLE_SCALE = jjConfig.ANKLE_SCALE || 1.1;
      const MIN_UP_MS = jjConfig.MIN_UP_MS || 200; // require the peak (UP) to last at least this ms

      const jjState = this.perModeState['jumpingjacks'];
      if (!jjState._lastRepAt) jjState._lastRepAt = 0;
      if (!jjState._upCount) jjState._upCount = 0;
      if (!jjState._downCount) jjState._downCount = 0;
      if (!jjState._baselineAnkleDist) jjState._baselineAnkleDist = null;
      if (!jjState._upSince) jjState._upSince = 0;
  // short running history to smooth noisy angle/distance jumps (rotation tolerant)
  if (!jjState._history) jjState._history = [];
  const HISTORY_MAX = jjConfig.HISTORY_MAX || 5;
      const now = Date.now();

      const vis = (p) => p && (p.visibility == null || p.visibility > 0.5);

  // Angle and position measures (frame values)
  const avgShoulderAbduction = (leftShoulderAbduction + rightShoulderAbduction) / 2;
  const avgHipAbduction = (leftHipAbduction + rightHipAbduction) / 2;
  const avgWristY = (leftWrist.y + rightWrist.y) / 2;
  const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const ankleDistance = Math.abs(leftAnkle.x - rightAnkle.x);
  const hipDistance = Math.abs(leftHip.x - rightHip.x);

  // Normalizers to make detection robust to camera tilt/zoom
  // Use shoulder span (x-distance) and torso height (shoulder y to hip y) as stable measures
  const shoulderSpan = Math.abs(leftShoulder.x - rightShoulder.x) || 0.0001;
  const torsoHeight = Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftHip.y + rightHip.y) / 2)) || 0.0001;
  // normalized ankle distance relative to shoulder span (accounts for zoom/tilt)
  const normalizedAnkleDistance = ankleDistance / shoulderSpan;
  const normalizedHipDistance = hipDistance / shoulderSpan;
  // normalized vertical wrist offset relative to torso height
  const wristAboveShoulderNorm = ((avgShoulderY - avgWristY) / torsoHeight) || 0;

  // Push latest measures into history and compute smoothed values
  jjState._history.push({ sa: avgShoulderAbduction, ha: avgHipAbduction, nad: normalizedAnkleDistance, nhd: normalizedHipDistance, wan: wristAboveShoulderNorm });
  if (jjState._history.length > HISTORY_MAX) jjState._history.shift();
  const smooth = { sa: 0, ha: 0, nad: 0, nhd: 0, wan: 0 };
  jjState._history.forEach(h => { smooth.sa += h.sa; smooth.ha += h.ha; smooth.nad += h.nad; smooth.nhd += h.nhd; smooth.wan += h.wan; });
  const hf = jjState._history.length || 1;
  const smoothedShoulderAbduction = smooth.sa / hf;
  const smoothedHipAbduction = smooth.ha / hf;
  const smoothedNormalizedAnkleDistance = smooth.nad / hf;
  const smoothedNormalizedHipDistance = smooth.nhd / hf;
  const smoothedWristAboveShoulder = smooth.wan / hf;

      // Initialize baseline ankle distance when in DOWN and we have a stable reading
      if (jjState.state === 'down' && (jjState._baselineAnkleDist == null) && ankleDistance > 0 && hipDistance > 0) {
        jjState._baselineAnkleDist = Math.max(hipDistance, ankleDistance * 0.9);
      }

      // Precise checks for peak/UP position
  // rotation/tilt tolerant checks
  const wristsAboveHead = vis(leftWrist) && vis(rightWrist) && (wristAboveShoulderNorm > 0.18); // wrists sufficiently above shoulders relative to torso height
  const anklesWider = normalizedAnkleDistance > Math.max((jjState._baselineAnkleDist ? (jjState._baselineAnkleDist / shoulderSpan) : normalizedHipDistance) * ANKLE_SCALE, normalizedHipDistance * ANKLE_SCALE);
      const shouldersAngleUp = smoothedShoulderAbduction > SHOULDER_ABDUCTION_UP;
      const hipsAngleApart = smoothedHipAbduction > HIP_ABDUCTION_UP;

      // Consider UP if peak is well-formed: wrists above head and ankles wider OR strong angle indicators
  // use smoothed/wrist-normalized checks for robustness to tilt
  const wristsAboveHeadSm = vis(leftWrist) && vis(rightWrist) && (smoothedWristAboveShoulder > 0.16);
  const anklesWiderSm = smoothedNormalizedAnkleDistance > Math.max((jjState._baselineAnkleDist ? (jjState._baselineAnkleDist / shoulderSpan) : smoothedNormalizedHipDistance) * ANKLE_SCALE, smoothedNormalizedHipDistance * ANKLE_SCALE);
  const isUpPeak = (wristsAboveHeadSm && anklesWiderSm) || (shouldersAngleUp && hipsAngleApart) || (wristsAboveHeadSm && hipsAngleApart) || (shouldersAngleUp && anklesWiderSm);

      // Consider DOWN if arms low and ankles near baseline
  const armsLow = avgShoulderAbduction < SHOULDER_ABDUCTION_DOWN;
  const anklesNarrow = smoothedNormalizedAnkleDistance < (((jjState._baselineAnkleDist || hipDistance) / shoulderSpan) * (ANKLE_SCALE - 0.05));
  const isDownPose = (armsLow && anklesNarrow) || (smoothedShoulderAbduction < SHOULDER_ABDUCTION_DOWN && smoothedHipAbduction < HIP_ABDUCTION_DOWN);

      // Debug info occasionally
      if ((jjState._debugCounter || 0) % 30 === 0) {
        jjState._debugCounter = 0;
        console.log('🔍 JJ Debug:', { avgShoulderAbduction: Math.round(avgShoulderAbduction), avgHipAbduction: Math.round(avgHipAbduction), wristsAboveHead, anklesWider, shouldersAngleUp, hipsAngleApart, state: jjState.state, count: jjState.count });
      } else {
        jjState._debugCounter = (jjState._debugCounter || 0) + 1;
      }

      // State transitions
      // short ignore window after counting to avoid immediate re-detection from jitter
      if (!jjState._ignoreUntil) jjState._ignoreUntil = 0;
      if (jjState.state === 'down') {
        if (isUpPeak) {
          // only count UP frames if not in ignore window
          if (now >= jjState._ignoreUntil) jjState._upCount += 1;
          if (!jjState._upSince) jjState._upSince = now;
        } else {
          jjState._upCount = 0;
          jjState._upSince = 0;
        }

        if (jjState._upCount >= UP_FRAMES && (now - (jjState._lastStateChange || 0)) > 120) {
          jjState.state = 'up';
          jjState._lastStateChange = now;
          jjState._upCount = 0;
          jjState._upSince = jjState._upSince || now;
        }

        // refresh baseline if idle
        if ((now - (jjState._lastStateChange || 0)) > 6000) {
          jjState._baselineAnkleDist = Math.max(hipDistance, ankleDistance * 0.9);
        }

      } else if (jjState.state === 'up') {
        const upDuration = jjState._upSince ? (now - jjState._upSince) : 0;
        if (isDownPose) {
          jjState._downCount += 1;
        } else {
          jjState._downCount = 0;
        }

        // only count when coming back to DOWN (end of rep), ensure UP lasted minimum time and down is stable
        if (jjState._downCount >= DOWN_FRAMES && upDuration >= MIN_UP_MS && (now - jjState._lastRepAt) > MIN_REP_MS) {
          jjState.state = 'down';
          jjState.count += 1;
          jjState._lastRepAt = now;
          jjState._lastStateChange = now;
          jjState._downCount = 0;
          jjState._upSince = 0;
          // set a short ignore window proportional to MIN_REP_MS to avoid jitter-based double counts
          jjState._ignoreUntil = now + Math.min(600, Math.floor(MIN_REP_MS / 2));
          // recalibrate baseline relative to shoulder span
          jjState._baselineAnkleDist = Math.max(hipDistance, ankleDistance * 0.9);
          console.log('🎯 Jumping Jack counted (end-of-rep)! Count:', jjState.count);
          this.playSuccessSound();
          if (this.onPushupCount) this.onPushupCount(jjState.count);
          if (this.onFormFeedback) this.onFormFeedback({ message: `Jumping Jack ${jjState.count}`, type: 'success', timestamp: now });
        }
      }

    } catch (error) {
      console.error('Error updating jumping jacks counter:', error);
    }
  }

  // Update side plank counter (time-based like regular plank)
  updateHighKneesCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};

      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];
      const leftKnee = landmarks[config.LEFT_KNEE || 25];
      const rightKnee = landmarks[config.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[config.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[config.RIGHT_ANKLE || 28];

      if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return;

      // Check if knee is at waist level or above (easier threshold)
      const KNEE_HIP_THRESHOLD = 0.03; // Knee should be at waist level or above (easier)
      const isLeftKneeHigh = (leftHip.y - leftKnee.y) > KNEE_HIP_THRESHOLD;
      const isRightKneeHigh = (rightHip.y - rightKnee.y) > KNEE_HIP_THRESHOLD;

      // Check if user is doing high knees movement (either leg up)
      const isDoingHighKnees = isLeftKneeHigh || isRightKneeHigh;

      // State machine for timing high knees (per-mode)
      const hk = this.perModeState['highknees'];
      if (!hk._highKneesState) hk._highKneesState = 'stopped';
      if (!hk._startTime) hk._startTime = 0;
      if (!hk._lastUpdateTime) hk._lastUpdateTime = 0;

      const now = Date.now();
      const MIN_MOVEMENT_INTERVAL = 100; // Minimum time between movements (ms)

      if (hk._highKneesState === 'stopped') {
        // Start timing when user begins high knees movement
        if (isDoingHighKnees) {
          hk._highKneesState = 'active';
          hk._startTime = now;
          hk._lastUpdateTime = now;
          hk.count = 0; // Reset count
          console.log('🏃 High Knees started!');
        }
      } else if (hk._highKneesState === 'active') {
        if (isDoingHighKnees) {
          // Continue timing while user is doing high knees
          hk._lastUpdateTime = now;
          const elapsedSeconds = Math.floor((now - hk._startTime) / 1000);
          
          // Update count (in seconds) every second
          if (elapsedSeconds > hk.count) {
            hk.count = elapsedSeconds;
            if (this.onPushupCount) this.onPushupCount(hk.count);
            console.log(`⏱️ High Knees: ${elapsedSeconds} seconds`);
          }
        } else {
          // Check if user stopped for too long
          const timeSinceLastMovement = now - hk._lastUpdateTime;
          if (timeSinceLastMovement > 1500) { // Stop if no movement for 1.5 seconds
            hk._highKneesState = 'stopped';
            console.log('⏹️ High Knees stopped!');
          }
        }
      }

    } catch (error) {
      console.error('Error updating high knees counter:', error);
    }
  }

  // Play warning sound
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
  drawPoseOverlay(canvasCtx, results, canvasWidth, canvasHeight) {
    // Only log occasionally to avoid spam
    if (Math.random() < 0.05) {
      console.log('🎨 Drawing pose overlay with', results.poseLandmarks?.length || 0, 'landmarks');
    }

    if (!results.poseLandmarks || !canvasCtx) {
      return;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw landmarks
    const landmarks = results.poseLandmarks;
    let drawnLandmarks = 0;
    
    landmarks.forEach((landmark, index) => {
      if (landmark.visibility && landmark.visibility > 0.5) {
        const x = landmark.x * canvasWidth;
        const y = landmark.y * canvasHeight;
        
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 6, 0, 2 * Math.PI); // Bigger circles
        canvasCtx.fillStyle = landmark.visibility > 0.7 ? '#10B981' : '#F59E0B';
        canvasCtx.fill();
        canvasCtx.strokeStyle = '#FFFFFF';
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
        drawnLandmarks++;
      }
    });

    // Only log occasionally
    if (Math.random() < 0.1) {
      console.log('✨ Drew', drawnLandmarks, 'landmarks');
    }

    // Always use basic connections (more reliable)
    this.drawBasicConnections(canvasCtx, landmarks, canvasWidth, canvasHeight);

    canvasCtx.restore();
  }

  // Draw basic pose connections
  drawBasicConnections(canvasCtx, landmarks, canvasWidth, canvasHeight) {
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

    let drawnConnections = 0;
    connections.forEach(([startIdx, endIdx]) => {
      const startPoint = landmarks[startIdx];
      const endPoint = landmarks[endIdx];

      if (startPoint && endPoint && 
          startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(startPoint.x * canvasWidth, startPoint.y * canvasHeight);
        canvasCtx.lineTo(endPoint.x * canvasWidth, endPoint.y * canvasHeight);
        canvasCtx.strokeStyle = '#3B82F6';
        canvasCtx.lineWidth = 3; // Thicker lines
        canvasCtx.stroke();
        drawnConnections++;
      }
    });
    
    // Only log occasionally
    if (Math.random() < 0.02) {
      console.log('✅ Drawing completed!', drawnConnections, 'connections');
    }
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
      if (mode === 'burpees') {
        this.perModeState[mode]._burpeeState = 'ready';
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
