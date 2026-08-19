export function evaluationConfiguration() {
  return {
    configured: Boolean(process.env.NVIDIA_NIM_API_KEY),
    message: process.env.NVIDIA_NIM_API_KEY
      ? "Evaluation integration is configured."
      : "NVIDIA NIM evaluation is disabled until NVIDIA_NIM_API_KEY is supplied."
  };
}
