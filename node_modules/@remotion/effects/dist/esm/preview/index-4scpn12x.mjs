import {
  WEBGPU_SINGLE_PASS_VERTEX
} from "./index-tvfexb7s.mjs";

// src/webgpu-mesh-runtime.ts
var setupWebGpuMesh = (target, label) => {
  const context = target.getContext("webgpu");
  if (!context)
    throw new Error(`WebGPU is not available for the ${label} effect`);
  return { context, label, resources: null };
};
var cleanupWebGpuMesh = (state) => {
  state.resources?.uniforms.destroy();
  state.resources?.multisample?.texture.destroy();
  state.resources?.multisample?.resolved.destroy();
  state.resources?.vertices?.buffer.destroy();
  state.resources?.source?.texture.destroy();
  state.resources = null;
  state.context.unconfigure();
};
var applyWebGpuMesh = ({
  state,
  source,
  width,
  height,
  vertices,
  device,
  shader,
  uniformData,
  topology,
  blend,
  vertexCount,
  instanceCount
}) => {
  const uniformSize = Math.max(16, Math.ceil(uniformData.byteLength / 16) * 16);
  if (state.resources && (state.resources.device !== device || state.resources.shader !== shader || state.resources.uniformSize !== uniformSize || state.resources.topology !== topology || state.resources.blend !== blend))
    cleanupWebGpuMesh(state);
  if (!state.resources) {
    const format = navigator.gpu.getPreferredCanvasFormat();
    state.context.configure({ device, format, alphaMode: "premultiplied" });
    const module = device.createShaderModule({
      code: shader,
      label: state.label
    });
    const blendComponent = {
      srcFactor: "one",
      dstFactor: "one-minus-src-alpha",
      operation: "add"
    };
    const pipeline = device.createRenderPipeline({
      label: state.label,
      layout: device.createPipelineLayout({
        bindGroupLayouts: [
          device.createBindGroupLayout({
            entries: [
              { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {} },
              { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
              {
                binding: 2,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: "uniform" }
              },
              {
                binding: 3,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: "read-only-storage" }
              }
            ]
          })
        ]
      }),
      vertex: { module, entryPoint: "vertex" },
      fragment: {
        module,
        entryPoint: "fragment",
        targets: [
          {
            format,
            ...blend ? { blend: { color: blendComponent, alpha: blendComponent } } : {}
          }
        ]
      },
      primitive: { topology },
      multisample: { count: 4 }
    });
    const flipModule = device.createShaderModule({
      code: `${WEBGPU_SINGLE_PASS_VERTEX}
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var sourceSampler: sampler;
@fragment fn fragment(input: VertexOutput) -> @location(0) vec4f {
 return textureSampleLevel(source,sourceSampler,vec2f(input.uv.x,1.0-input.uv.y),0);
}`
    });
    const flipPipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module: flipModule, entryPoint: "vertex" },
      fragment: {
        module: flipModule,
        entryPoint: "fragment",
        targets: [{ format }]
      },
      primitive: { topology: "triangle-list" }
    });
    state.resources = {
      device,
      shader,
      uniformSize,
      topology,
      blend,
      pipeline,
      flipPipeline,
      sampler: device.createSampler({ magFilter: "linear", minFilter: "linear" }),
      uniforms: device.createBuffer({
        size: uniformSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      }),
      vertices: null,
      multisample: null,
      source: null
    };
  }
  const r = state.resources;
  const sourceWidth = "displayWidth" in source ? source.displayWidth : ("videoWidth" in source) ? source.videoWidth : ("naturalWidth" in source) ? source.naturalWidth : typeof source.width === "number" ? source.width : source.width.baseVal.value;
  const sourceHeight = "displayHeight" in source ? source.displayHeight : ("videoHeight" in source) ? source.videoHeight : ("naturalHeight" in source) ? source.naturalHeight : typeof source.height === "number" ? source.height : source.height.baseVal.value;
  if (r.source && (r.source.width !== sourceWidth || r.source.height !== sourceHeight)) {
    r.source.texture.destroy();
    r.source = null;
  }
  if (!r.source)
    r.source = {
      width: sourceWidth,
      height: sourceHeight,
      texture: device.createTexture({
        size: [sourceWidth, sourceHeight],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      })
    };
  device.queue.copyExternalImageToTexture({ source }, { texture: r.source.texture, premultipliedAlpha: true }, [sourceWidth, sourceHeight]);
  const size = Math.max(4, vertices?.byteLength ?? 0);
  if (!r.vertices || r.vertices.size < size) {
    r.vertices?.buffer.destroy();
    r.vertices = {
      size,
      buffer: device.createBuffer({
        size,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      })
    };
  }
  if (vertices)
    device.queue.writeBuffer(r.vertices.buffer, 0, vertices.buffer, vertices.byteOffset, vertices.byteLength);
  device.queue.writeBuffer(r.uniforms, 0, uniformData);
  const bindGroup = device.createBindGroup({
    layout: r.pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: r.source.texture.createView() },
      { binding: 1, resource: r.sampler },
      { binding: 2, resource: { buffer: r.uniforms } },
      { binding: 3, resource: { buffer: r.vertices.buffer } }
    ]
  });
  if (r.multisample && (r.multisample.width !== width || r.multisample.height !== height)) {
    r.multisample.texture.destroy();
    r.multisample.resolved.destroy();
    r.multisample = null;
  }
  if (!r.multisample)
    r.multisample = {
      width,
      height,
      resolved: device.createTexture({
        size: [width, height],
        format: navigator.gpu.getPreferredCanvasFormat(),
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
      }),
      texture: device.createTexture({
        size: [width, height],
        format: navigator.gpu.getPreferredCanvasFormat(),
        sampleCount: 4,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      })
    };
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: r.multisample.texture.createView(),
        resolveTarget: r.multisample.resolved.createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
        loadOp: "clear",
        storeOp: "store"
      }
    ]
  });
  pass.setPipeline(r.pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.draw(vertexCount, instanceCount);
  pass.end();
  const flipGroup = device.createBindGroup({
    layout: r.flipPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: r.multisample.resolved.createView() },
      { binding: 1, resource: r.sampler }
    ]
  });
  const flipPass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: state.context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
        loadOp: "clear",
        storeOp: "store"
      }
    ]
  });
  flipPass.setPipeline(r.flipPipeline);
  flipPass.setBindGroup(0, flipGroup);
  flipPass.draw(3);
  flipPass.end();
  device.queue.submit([encoder.finish()]);
};

export { setupWebGpuMesh, cleanupWebGpuMesh, applyWebGpuMesh };
