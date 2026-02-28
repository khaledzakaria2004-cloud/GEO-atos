// MediaPipe configuration and utilities for the fitness app
window.MediaPipeConfig = {
  // CDN URLs for MediaPipe
  POSE_MODEL_URL: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose',
  CAMERA_UTILS_URL: 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils',
  DRAWING_UTILS_URL: 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils',
  
  // Backend selection: 'mediapipe' (default) or 'blazepose_tfjs'
  POSE_BACKEND: 'mediapipe',
  // TFJS CDN URLs for BlazePose backend - using stable versions
  TFJS_CORE_URL: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.10.0/dist/tf-core.esm.js',
  TFJS_CONVERTER_URL: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.10.0/dist/tf-converter.esm.js',
  TFJS_BACKEND_WEBGL_URL: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.10.0/dist/tf-backend-webgl.esm.js',
  POSE_DETECTION_URL: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.esm.js',
  BLAZEPOSE_MODEL_TYPE: 'lite', // 'lite'|'full'|'heavy'
  
  // Pose detection settings optimized for web
  POSE_CONFIG: {
    modelComplexity: 0, // 0 = fastest, 1 = balanced, 2 = most accurate
    smoothLandmarks: false, // Disable to reduce memory usage
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.7, // Higher confidence for stability
    minTrackingConfidence: 0.5,
    staticImageMode: false, // Process video stream
    maxNumHands: 0 // Disable hand detection to save memory
  },
  
  // Push-up specific settings - made more lenient for better detection
  PUSHUP_CONFIG: {
    ELBOW_ANGLE_DOWN: 110,   // more lenient: degrees for down position
    ELBOW_ANGLE_UP: 140,     // more lenient: degrees for up position  
    SHOULDER_HEIGHT_DOWN: 0.05, // more lenient shoulder position
    BACK_ALIGNMENT_MIN: 140, // more lenient minimum angle for good posture
    BACK_ALIGNMENT_MAX: 220, // more lenient maximum angle for good posture
    WARNING_COOLDOWN: 2000   // milliseconds between warnings
  },
  
  // Plank-specific settings
  PLANK_CONFIG: {
    BACK_ALIGNMENT_MIN: 120, // widened for robustness across angles
    BACK_ALIGNMENT_MAX: 260,
    WARNING_COOLDOWN: 2000,
    STRAIGHT_ABS_COS_MIN: 0.90, // accept |cos| >= this
    HORIZ_MAX_DEG: 35,          // line orientation tolerance to horizontal
    KNEE_MIN_DEG: 150           // optional knee straightness
  },
  
  // Squat-specific settings
  SQUAT_CONFIG: {
    // Simplified squat detection based on hip position and torso verticality
    HIP_BELOW_KNEE_MIN: 0.01, // Minimal threshold: hip Y exceeds knee Y (going down)
    TORSO_VERTICAL_THRESHOLD: 25, // degrees: torso must be within 25° of vertical to count rep
    // Timing constraints
    MIN_REP_MS: 450,        // Minimum time between reps
    WARNING_COOLDOWN: 2000,
    
    // Legacy thresholds (kept for backward compatibility but not used in simplified logic)
    KNEE_ANGLE_DOWN: 125,
    KNEE_ANGLE_UP: 155,
    HIP_ANGLE_MIN: 130,
    TORSO_TILT_MIN: 0,
    TORSO_TILT_MAX: 70
  },
  
  // Lunges-specific settings
  LUNGES_CONFIG: {
    // Front knee angle thresholds (hip-knee-ankle)
    FRONT_KNEE_ANGLE_DOWN: 100,  // easier: front knee bent for lunge
    FRONT_KNEE_ANGLE_UP: 170,    // easier: front knee straight for standing
    // Back knee angle thresholds (hip-knee-ankle) 
    BACK_KNEE_ANGLE_DOWN: 110,   // easier: back knee close to ground
    BACK_KNEE_ANGLE_UP: 160,     // easier: back knee straight for standing
    // Hip position relative to front knee
    HIP_BELOW_FRONT_KNEE_MIN: 0.001, // easier: hip should be below front knee
    // Torso alignment tolerance
    TORSO_TILT_MAX: 60,          // easier: allow more forward lean
    WARNING_COOLDOWN: 2000
  },
  
  // Jumping Jacks-specific settings
  JUMPINGJACKS_CONFIG: {
    // Shoulder abduction angles (shoulder-elbow-wrist) - arms overhead
    SHOULDER_ABDUCTION_DOWN: 40,    // degrees: arms down (stricter)
    SHOULDER_ABDUCTION_UP: 145,     // degrees: arms overhead (more lenient for rotation)
    
    // Hip abduction angles (hip-knee-ankle) - legs apart
    HIP_ABDUCTION_DOWN: 12,          // degrees: legs together (stricter)
    HIP_ABDUCTION_UP: 32,            // degrees: legs apart (slightly more lenient)
    
    // Timing and debouncing
    MIN_REP_MS: 800,                // minimum milliseconds between reps
    MIN_UP_MS: 200,                 // minimum time UP position must be held
    UP_FRAMES: 2,                   // frames required to confirm UP state
    DOWN_FRAMES: 3,                 // frames required to confirm DOWN state
    ANKLE_SCALE: 1.1,               // scaling factor for ankle distance
    HISTORY_MAX: 5,                 // maximum frames for smoothing
    WARNING_COOLDOWN: 2000          // milliseconds between warnings
  },
  
  // High Knees-specific settings
  HIGHKNEES_CONFIG: {
    // Knee height threshold (normalized units relative to torso length)
    KNEE_ABOVE_HIP_THRESHOLD: 0.3,  // knee must be 0.3 torso units above hip
    
    // Knee flexion angle thresholds (hip-knee-ankle)
    KNEE_FLEXION_PEAK: 120,         // degrees: maximum knee angle at peak (flexed)
    KNEE_FLEXION_DOWN: 150,         // degrees: minimum knee angle when leg is down
    
    // Alternation timing
    MIN_ALTERNATION_TIME: 250,      // milliseconds: minimum time between leg alternations
    MAX_ALTERNATION_TIME: 2000,     // milliseconds: maximum time for valid alternation
    
    // Timing and debouncing
    MIN_REP_MS: 400,                // minimum milliseconds between reps
    
    // Occlusion fallback settings
    ANKLE_VELOCITY_THRESHOLD: 0.05, // normalized units per frame for velocity detection
    MIN_VISIBILITY: 0.35,           // minimum visibility for reliable detection
    
    // Smoothing
    EMA_ALPHA: 0.3,                 // EMA smoothing factor for positions
    
    // Warning cooldown
    WARNING_COOLDOWN: 2000          // milliseconds between warnings
  },
  
  // Side Plank-specific settings
  SIDEPLANK_CONFIG: {
    // Shoulder support angle (shoulder-elbow-wrist) - should be ~90°
    SHOULDER_ANGLE_MIN: 80,         // degrees: minimum elbow angle
    SHOULDER_ANGLE_MAX: 100,        // degrees: maximum elbow angle
    
    // Torso-hip line (shoulder-hip-ankle) - should be ~180° (straight line)
    TORSO_ANGLE_MIN: 160,           // degrees: minimum straight line angle
    TORSO_ANGLE_MAX: 200,           // degrees: maximum straight line angle
    
    // Hip position thresholds (normalized units)
    HIP_SAG_THRESHOLD: 0.05,        // hip sagging tolerance
    HIP_HIKE_THRESHOLD: 0.05,       // hip hiking tolerance
    
    // Elbow alignment (elbow should be under shoulder)
    ELBOW_ALIGNMENT_THRESHOLD: 0.08, // normalized units
    
    // Feet stacking (ankles should be close together)
    FEET_STACKING_THRESHOLD: 0.1,   // normalized units
    
    // Head-neck alignment (ear-shoulder-hip should be ~180°)
    HEAD_NECK_ANGLE_MIN: 160,       // degrees: minimum head-neck alignment
    HEAD_NECK_ANGLE_MAX: 200,       // degrees: maximum head-neck alignment
    
    // Posture smoothing
    POSTURE_GOOD_FRAMES: 3,         // consecutive good frames to confirm correct posture
    POSTURE_BAD_FRAMES: 4,          // consecutive bad frames to confirm incorrect posture
    
    // Warning cooldown
    WARNING_COOLDOWN: 2000          // milliseconds between warnings
  },
  
  // Wall Sit-specific settings - Simplified multi-angle support
  WALLSIT_CONFIG: {
    // Angles (degrees) - lenient for multi-angle support
    KNEE_ANGLE_MIN: 60,             // degrees: minimum knee angle (very lenient)
    KNEE_ANGLE_MAX: 130,            // degrees: maximum knee angle (very lenient)
    HIP_ANGLE_MIN: 60,              // degrees: minimum hip angle (very lenient)
    HIP_ANGLE_MAX: 130,             // degrees: maximum hip angle (very lenient)
    
    // Symmetry & alignment - lenient for different camera angles
    KNEE_ANGLE_DIFF_MAX: 30,        // degrees: max difference between left/right knees
    WALL_ALIGNMENT_MAX: 0.15,       // normalized units: maximum x-axis displacement
    TORSO_TILT_MAX: 30,             // degrees: max torso tilt from vertical
    
    // Visibility floor for critical landmarks
    MIN_VISIBILITY: 0.35,           // minimum landmark visibility
    
    // Hysteresis (frames) - responsive for better UX
    HYSTERESIS_GOOD: 2,             // consecutive good frames to start holding
    HYSTERESIS_BAD: 4,              // consecutive bad frames to pause holding
    
    // Messaging & warnings
    WARNING_COOLDOWN: 2000,         // ms between posture warnings
    ENABLE_HOLD_TIMER: true         // enable time accumulation
  },
  
  // Sit-up specific settings - Multi-metric flexible approach
  SITUP_CONFIG: {
    // Baseline calibration
    BASELINE_FRAMES: 30,            // frames to collect for baseline (lying down position)
    
    // Normalized distance ratios (relative to baseline) - PRIMARY
    SHOULDER_DOWN_RATIO: 0.88,      // shoulder-knee distance > 0.88 = lying down
    SHOULDER_UP_RATIO: 0.62,        // shoulder-knee distance < 0.62 = sitting up
    
    // Head/nose distance ratios (relative to baseline) - SECONDARY
    HEAD_DOWN_RATIO: 0.90,          // head-knee distance > 0.90 = lying down
    HEAD_UP_RATIO: 0.55,            // head-knee distance < 0.55 = sitting up
    
    // Torso cosine thresholds (torso vector dot product with up vector) - TERTIARY
    DOWN_TORSO_COS: 0.35,           // torso cosine < 0.35 = horizontal (lying down)
    UP_TORSO_COS: 0.70,             // torso cosine > 0.70 = vertical (sitting up)
    
    // Hip angle constraint (very relaxed, just to ensure it's a sit-up not leg raise)
    HIP_ANGLE_MAX: 160,             // degrees: very relaxed constraint
    
    // Multi-metric voting system
    MIN_METRICS_FOR_DOWN: 1,        // minimum metrics agreeing for DOWN state
    MIN_METRICS_FOR_UP: 2,          // minimum metrics agreeing for UP state (more strict)
    
    // Timing constraints
    MIN_REP_MS: 600,                // milliseconds: minimum time between reps
    
    // Hysteresis for stability
    HYSTERESIS_GOOD: 2,             // consecutive frames required for state change to "up"
    HYSTERESIS_BAD: 3,              // consecutive frames required for state change to "down"
    
    // Warning system
    WARNING_COOLDOWN: 2000          // milliseconds between form warnings
  },
  
  // Pose landmark indices (MediaPipe standard)
  POSE_LANDMARKS: {
    NOSE: 0,
    LEFT_EYE_INNER: 1,
    LEFT_EYE: 2,
    LEFT_EYE_OUTER: 3,
    RIGHT_EYE_INNER: 4,
    RIGHT_EYE: 5,
    RIGHT_EYE_OUTER: 6,
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    MOUTH_LEFT: 9,
    MOUTH_RIGHT: 10,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_PINKY: 17,
    RIGHT_PINKY: 18,
    LEFT_INDEX: 19,
    RIGHT_INDEX: 20,
    LEFT_THUMB: 21,
    RIGHT_THUMB: 22,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
    LEFT_HEEL: 29,
    RIGHT_HEEL: 30,
    LEFT_FOOT_INDEX: 31,
    RIGHT_FOOT_INDEX: 32
  },
  
  // Live webcam presets for different lighting conditions
  LIVE_WEBCAM_PRESETS: {
    // Bright lighting (direct sunlight, well-lit room)
    bright: {
      minVisibility: 0.4,
      minDetectionConfidence: 0.75,
      minTrackingConfidence: 0.6,
      exposureCompensation: 0, // No adjustment needed
      description: 'Bright lighting with direct sunlight or strong indoor lighting'
    },
    // Normal lighting (typical indoor conditions)
    normal: {
      minVisibility: 0.35,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
      exposureCompensation: 0,
      description: 'Normal indoor lighting conditions'
    },
    // Dim lighting (evening, low light)
    dim: {
      minVisibility: 0.3,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.45,
      exposureCompensation: 0.2, // Suggest increasing exposure
      description: 'Dim lighting conditions (evening, low light)'
    },
    // Backlit (window behind user)
    backlit: {
      minVisibility: 0.3,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.45,
      exposureCompensation: 0.3, // Suggest significant exposure increase
      description: 'Backlit conditions (window or light source behind user)'
    },
    // Auto-detect (default - adapts based on visibility scores)
    auto: {
      minVisibility: 0.35,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
      exposureCompensation: 0,
      description: 'Automatic adaptation based on detected conditions'
    }
  },
  
  // Default calibration values for baseline measurements
  CALIBRATION_DEFAULTS: {
    // Shoulder width (normalized units) - typical range 0.15-0.25
    shoulderWidth: 0.2,
    // Neutral ankle spacing (normalized units) - typical range 0.08-0.15
    neutralAnkleSpacing: 0.12,
    // Torso length from shoulders to hips (normalized units) - typical range 0.25-0.35
    torsoLength: 0.3,
    // Neutral hip height (normalized units) - typical range 0.45-0.55
    neutralHipHeight: 0.5,
    // Neutral knee angle in standing position (degrees) - typical range 175-180
    neutralKneeAngle: 178,
    // Camera distance estimation factor (based on shoulder width)
    cameraDistanceFactor: 1.0,
    // Calibration duration in milliseconds
    calibrationDurationMs: 3000,
    // Minimum frames required for stable calibration
    minStableFrames: 30
  },
  
  // Telemetry configuration for debugging and validation
  TELEMETRY_CONFIG: {
    // Enable/disable telemetry emission
    enabled: false,
    // Event types to capture
    eventTypes: {
      frameProcessed: true,      // Every frame processed
      frameSkipped: true,        // Frames skipped due to visibility
      repCounted: true,          // Successful rep count
      stateTransition: true,     // State machine transitions
      postureWarning: true,      // Posture validation failures
      anomalyDetected: true,     // Unrealistic cadence or other anomalies
      calibrationComplete: true  // Calibration finished
    },
    // Sampling rate (1.0 = all events, 0.1 = 10% of events)
    samplingRate: 1.0,
    // Maximum events to buffer before dropping old events
    maxBufferSize: 100,
    // Include landmark coordinates in telemetry (increases data size)
    includeLandmarks: false,
    // Include computed angles in telemetry
    includeAngles: true,
    // Include visibility scores in telemetry
    includeVisibility: true,
    // Custom event name for dispatching
    eventName: 'pose-telemetry'
  },
  
  // Hysteresis configuration for posture state transitions
  HYSTERESIS_CONFIG: {
    // Push-ups (horizontal orientation)
    pushups: {
      goodFrames: 3,  // Consecutive good frames to confirm correct posture
      badFrames: 5    // Consecutive bad frames to confirm incorrect posture
    },
    // Squats (vertical orientation)
    squats: {
      goodFrames: 2,
      badFrames: 4
    },
    // Lunges (vertical orientation)
    lunges: {
      goodFrames: 2,
      badFrames: 4
    },
    // Jumping jacks (vertical orientation, cardio - more lenient)
    jumpingjacks: {
      goodFrames: 1,
      badFrames: 3
    },
    // High knees (vertical orientation, cardio - more lenient)
    highknees: {
      goodFrames: 1,
      badFrames: 3
    },
    // Wall sit (vertical orientation)
    wallsit: {
      goodFrames: 3,
      badFrames: 5
    },
    // Sit-ups (horizontal orientation)
    situps: {
      goodFrames: 2,
      badFrames: 4
    },
    // Plank (horizontal orientation)
    plank: {
      goodFrames: 3,
      badFrames: 5
    },
    // Side plank (horizontal orientation)
    sideplank: {
      goodFrames: 3,
      badFrames: 4
    }
  },
  
  // Critical landmarks map - defines required landmarks per exercise type
  CRITICAL_LANDMARKS_MAP: {
    // Push-ups require shoulders, elbows, wrists, hips, knees
    pushups: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26],
    
    // Squats require hips, knees, ankles, shoulders
    squats: [11, 12, 23, 24, 25, 26, 27, 28],
    
    // Lunges require hips, knees, ankles, shoulders
    lunges: [11, 12, 23, 24, 25, 26, 27, 28],
    
    // Jumping jacks require shoulders, wrists, hips, ankles
    jumpingjacks: [11, 12, 15, 16, 23, 24, 27, 28],
    
    // High knees require hips, knees, ankles
    highknees: [23, 24, 25, 26, 27, 28],
    
    // Wall sit requires hips, knees, ankles, shoulders
    wallsit: [11, 12, 23, 24, 25, 26, 27, 28],
    
    // Sit-ups require shoulders, hips, knees, wrists
    situps: [11, 12, 15, 16, 23, 24, 25, 26],
    
    // Plank requires shoulders, elbows, wrists, hips, knees, ankles
    plank: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28],
    
    // Side plank requires shoulders, elbows, hips, ankles
    sideplank: [11, 12, 13, 14, 23, 24, 27, 28]
  }
};
