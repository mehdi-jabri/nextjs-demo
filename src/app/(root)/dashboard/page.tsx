"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useSession } from "next-auth/react";

enum Gender {
  Male = "male",
  Female = "female",
}

interface DashboardFormData {
  fieldOne: string;
  fieldTwo: string;
  fieldThree: string;
  saveInfo: boolean;
  gender: Gender;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldOneLength, setFieldOneLength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DashboardFormData>({
    defaultValues: {
      fieldOne: "",
      fieldTwo: "",
      fieldThree: "",
      saveInfo: false,
      gender: Gender.Male,
    },
  });

  // Watch the fieldOne value to update the character count
  const fieldOneValue = watch("fieldOne");

  // Update the character count whenever fieldOne changes
  useState(() => {
    setFieldOneLength(fieldOneValue?.length || 0);
  }, [fieldOneValue]);

  const onSubmit = async (data: DashboardFormData) => {
    setLoading(true);
    setSubmitError("");

    if (status !== "authenticated") {
      setSubmitError("You must be logged in to submit data");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit form");
      }
      const responseData = await response.json();
      setResult(responseData);
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for fieldOne to enforce exactly 11 characters
  const handleFieldOneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Limit input to a maximum of 11 characters
    if (value.length <= 11) {
      setFieldOneLength(value.length);
    }
  };

  // Show loading or unauthenticated state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-4">You need to be logged in to access this page.</p>
          <Button
            onClick={() => window.location.href = "/api/auth/signin"}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-center items-center py-12">
        <div className="w-full max-w-md bg-white shadow-md rounded px-8 py-6">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Submit Your Data
          </h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Field One - with exactly 11 characters validation */}
            <div>
              <Tooltip>
                <TooltipTrigger>
                  <Label htmlFor="fieldOne" className="block mb-1">
                    Input One<span className="text-red-500 ml-1">*</span>
                  </Label>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-gray-800 text-white px-3 py-1 rounded shadow-lg text-xs"
                >
                  <p>Enter exactly 11 characters.</p>
                </TooltipContent>
              </Tooltip>
              <div className="relative">
                <Input
                  id="fieldOne"
                  placeholder="Enter exactly 11 characters"
                  className="w-full"
                  maxLength={11}
                  onChange={handleFieldOneChange}
                  {...register("fieldOne", {
                    required: "Field One is required",
                    validate: (value) =>
                      value.length === 11 || "Field must be exactly 11 characters",
                    onChange: handleFieldOneChange
                  })}
                />
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${
                  fieldOneLength === 11 ? 'text-green-500' : 'text-gray-500'
                }`}>
                  {fieldOneLength}/11
                </span>
              </div>
              {errors.fieldOne && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.fieldOne.message}
                </p>
              )}
            </div>
            {/* Field Two */}
            <div>
              <Tooltip>
                <TooltipTrigger>
                  <Label htmlFor="fieldTwo" className="block mb-1">
                    Input Two<span className="text-red-500 ml-1">*</span>
                  </Label>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-gray-800 text-white px-3 py-1 rounded shadow-lg text-xs"
                >
                  <p>Enter the second value here.</p>
                </TooltipContent>
              </Tooltip>
              <Input
                id="fieldTwo"
                placeholder="Enter second value"
                className="w-full"
                {...register("fieldTwo", { required: "Field Two is required" })}
              />
              {errors.fieldTwo && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.fieldTwo.message}
                </p>
              )}
            </div>
            {/* Field Three */}
            <div>
              <Tooltip>
                <TooltipTrigger>
                  <Label htmlFor="fieldThree" className="block mb-1">
                    Input Three<span className="text-red-500 ml-1">*</span>
                  </Label>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-gray-800 text-white px-3 py-1 rounded shadow-lg text-xs"
                >
                  <p>Enter the third value here.</p>
                </TooltipContent>
              </Tooltip>
              <Input
                id="fieldThree"
                placeholder="Enter third value"
                className="w-full"
                {...register("fieldThree", { required: "Field Three is required" })}
              />
              {errors.fieldThree && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.fieldThree.message}
                </p>
              )}
            </div>
            {/* Save Info Checkbox */}
            <div>
              <Tooltip>
                <TooltipTrigger>
                  <Label htmlFor="saveInfo" className="block mb-1">
                    Save Information
                  </Label>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-gray-800 text-white px-3 py-1 rounded shadow-lg text-xs"
                >
                  <p>Check if you want to save your information.</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex items-center">
                <input
                  id="saveInfo"
                  type="checkbox"
                  className="mr-2"
                  {...register("saveInfo")}
                />
                <span className="text-sm">Save my information</span>
              </div>
            </div>
            {/* Gender Radio Group */}
            <div>
              <Tooltip>
                <TooltipTrigger>
                  <Label htmlFor="gender" className="block mb-1">
                    Gender
                  </Label>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-gray-800 text-white px-3 py-1 rounded shadow-lg text-xs"
                >
                  <p>Select your gender.</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value={Gender.Male}
                    {...register("gender")}
                    className="mr-2"
                  />
                  <span className="text-sm">Male</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value={Gender.Female}
                    {...register("gender")}
                    className="mr-2"
                  />
                  <span className="text-sm">Female</span>
                </label>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || fieldOneLength !== 11}
              className={`w-full ${fieldOneLength !== 11 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
            {submitError && (
              <p className="text-red-500 text-sm mt-2">{submitError}</p>
            )}
          </form>
          {result && (
            <div className="mt-6 bg-gray-100 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">Result</h2>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
