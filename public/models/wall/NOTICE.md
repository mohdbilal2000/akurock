# Models in this folder

Both run in the visitor's browser (ONNX Runtime Web); neither is called on a server.

| File | What it is | Source | License |
|---|---|---|---|
| `seg-upernet-convnext-t-q8.onnx` | UperNet + ConvNeXt-Tiny trained on ADE20K, 8-bit dynamic-quantized here from the fp32 ONNX export | `JElvis/upernet-convnext-tiny-ade-onnx` (from `openmmlab/upernet-convnext-tiny`) | MIT |
| `depth-metric-indoor-s-q8.onnx` | Depth Anything V2 Metric (Hypersim, ViT-S), 8-bit dynamic-quantized here from the fp32 ONNX export | `77ukhtar/depth-anything-v2-metric-onnx` (from `depth-anything/Depth-Anything-V2-Metric-Hypersim-Small`) | Apache-2.0 |

Citation: Yang et al., "Depth Anything V2", arXiv:2406.09414. Xiao et al., "Unified Perceptual Parsing for Scene Understanding", ECCV 2018. Liu et al., "A ConvNet for the 2020s", CVPR 2022.
