import type { ApiResponse } from "@/types/common";
import { publicAxios } from "./axiosInstance";

const locationService = {
  getCities: async () => {
    const response =
      await publicAxios.get<ApiResponse<{ id: string; name: string }[]>>(
        "/locations/cities",
      );
    return response.data;
  },

  getDistricts: async (cityId: string) => {
    const response = await publicAxios.get<
      ApiResponse<{ id: string; name: string }[]>
    >("/locations/districts", {
      params: { city_id: cityId },
    });
    return response.data;
  },
};

export default locationService;
