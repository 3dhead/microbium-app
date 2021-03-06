import { vec2, vec3, mat4 } from 'gl-matrix'
import { radialPosition } from '@renderer/utils/math'

export function createCameras (tasks, state, renderer) {
  const { regl } = renderer

  const scratchVec3A = vec3.create()
  const scratchVec3B = vec3.create()

  const baseUniforms = {
    viewResolution: regl.prop('viewResolution'),
    viewOffset: regl.prop('viewOffset'),
    viewScale: regl.prop('viewScale')
  }

  const sceneOrtho = (() => {
    const view = mat4.create()
    const projection = mat4.create()

    const setup = regl({
      uniforms: {
        ...baseUniforms,
        view: (context, props) => {
          const { viewOffset, viewScale } = props
          const offset3 = vec3.set(scratchVec3A, viewOffset[0], viewOffset[1], 0)
          const scale3 = vec3.set(scratchVec3B, viewScale, viewScale, viewScale)
          mat4.fromTranslation(view, offset3)
          mat4.scale(view, view, scale3)
          return view
        },
        projection: () => projection,
        projectionMode: 0
      }
    })

    const update = () => {
    }

    const updateProjection = (size) => {
      const w = size[0] / 4
      const h = size[1] / 4
      mat4.ortho(projection, -w, w, h, -h, 0, 2000)
    }

    return {
      view,
      projection,
      lineScaleFactor: 1,
      shouldAdjustThickness: true,
      setup,
      update,
      updateProjection
    }
  })()

  const scenePerspective = (() => {
    const view = mat4.create()
    const projection = mat4.create()
    const colorMasks = {
      none: [true, true, true, true],
      left: [false, true, true, true],
      right: [true, false, false, true]
    }

    // FIXME: Inverted up vector
    const polarPosition = vec2.create()
    const eye = vec3.create()
    const eyeTarget = vec3.create()
    const eyeOffset = vec3.create()
    const eyeStereoOffset = vec3.create()
    const center = vec3.create()
    const up = vec3.set(vec3.create(), 0, -1, 0)

    const setup = regl({
      uniforms: {
        ...baseUniforms,
        view: (context, props) => {
          updateEyeStereo(props)
          vec3.set(center, 0, 0, state.controls.camera.depthOffset + 100)
          vec3.add(eyeOffset, eye, eyeStereoOffset)
          mat4.lookAt(view, eyeOffset, center, up)
          return view
        },
        projection: () => projection,
        projectionMode: 1
      },
      colorMask: (context, props) => {
        return props.eyeMask
          ? colorMasks[props.eyeMask]
          : colorMasks.none
      }
    })

    // TODO: Check stereo offset calculation
    const updateEyeStereo = (props) => {
      const { stereoDistance } = props
      const isStereo = props.eyeMask && props.eyeMask !== 'none'

      if (isStereo) {
        vec3.cross(eyeStereoOffset, eye, up)
        vec3.normalize(eyeStereoOffset, eyeStereoOffset)
      } else {
        vec3.set(eyeStereoOffset, 0, 0, 0)
      }

      switch (props.eyeMask) {
        case 'left':
          vec3.scale(eyeStereoOffset, eyeStereoOffset, stereoDistance)
          break
        case 'right':
          vec3.scale(eyeStereoOffset, eyeStereoOffset, -stereoDistance)
          break
      }
    }

    const updateEye = () => {
      const cameraState = state.controls.camera
      const { polarOffset, polarAngle, depthOffset, tweenFactor } = cameraState

      polarPosition[1] = polarOffset * polarOffset
      radialPosition(eyeTarget, polarPosition,
        polarAngle / 180 * Math.PI)
      eyeTarget[2] = -(depthOffset * depthOffset)

      eye[0] += (eyeTarget[0] - eye[0]) * tweenFactor
      eye[1] += (eyeTarget[1] - eye[1]) * tweenFactor
      eye[2] += (eyeTarget[2] - eye[2]) * tweenFactor
    }

    const update = () => {
      updateEye()
    }

    // TODO: Add tween to fov change
    let currentAspect = null
    let currentFov = null
    const updateProjection = (size, fov) => {
      const aspect = size[0] / size[1]
      const fovRads = fov / 180 * Math.PI
      if (currentAspect === aspect && currentFov === fov) return

      currentAspect = aspect
      currentFov = fov
      mat4.perspective(projection, fovRads, aspect, 0.01, 10000)
    }

    return {
      view,
      projection,
      lineScaleFactor: 0,
      shouldAdjustThickness: false,
      setup,
      update,
      updateProjection
    }
  })()

  // TODO: Improve determining active camera
  const getActiveCamera = () => {
    const { isRunning } = state.simulation
    const { enabled } = state.controls.camera
    return (isRunning && enabled) ? scenePerspective : sceneOrtho
  }

  tasks.add((event) => {
    const { size } = state.viewport
    const { fov } = state.controls.camera
    sceneOrtho.updateProjection(size)
    scenePerspective.updateProjection(size, fov)
  }, 'resize')

  tasks.registerResponder('cameras.updateProjection', null, () => {
    const { size } = state.viewport
    const { fov } = state.controls.camera
    scenePerspective.updateProjection(size, fov)
  })

  tasks.registerResponder('cameras.scene', null, () => {
    return getActiveCamera()
  })

  return {
    get scene () {
      return getActiveCamera()
    }
  }
}
