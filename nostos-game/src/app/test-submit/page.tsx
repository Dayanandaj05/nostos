"use client";
import { useActionState } from "react";

const testAction = async (state: any, formData: FormData) => {
  console.log("TEST SUBMIT ACTION FIRED with answer:", formData.get("answer"));
  return { success: true };
};

export default function TestSubmitPage() {
  const [state, formAction] = useActionState(testAction, { success: false });
  return (
    <div className="p-10">
      <h1 className="text-white">Testing Next.js Form Submit</h1>
      <form id="oracle-form" action={formAction} className="sr-only">
        <input name="answer" type="hidden" />
        <button id="oracle-submit-btn" type="submit" />
      </form>
      <button 
        className="bg-blue-500 p-4" 
        onClick={() => {
          const form = document.getElementById('oracle-form') as HTMLFormElement;
          const input = form.querySelector('input') as HTMLInputElement;
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
          nativeInputValueSetter?.call(input, "ECHO");
          input.dispatchEvent(new Event("input", { bubbles: true }));
          document.getElementById('oracle-submit-btn')?.click();
        }}
      >
        Simulate Puzzle Complete
      </button>
      <div className="text-white mt-4">
        Status: {state.success ? "SUBMITTED SUCCESS" : "Waiting..."}
      </div>
    </div>
  );
}
