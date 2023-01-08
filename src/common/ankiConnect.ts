const AC_ENDPOINT = "http://localhost:8765";
const AC_VERSION = 6;

export async function acFetch(action: string, params = {}): Promise<any> {
  const res = await fetch(AC_ENDPOINT, {
    method: "POST", body: JSON.stringify({ action, version: AC_VERSION, params})
  });
  const resJson = await res.json();
  if (Object.getOwnPropertyNames(resJson).length != 2) {
    throw "response has an unexpected number of fields";
  }
  if (!resJson.hasOwnProperty("error")) {
    throw "response is missing required error field";
  }
  if (!resJson.hasOwnProperty("result")) {
    throw "response is missing required result field";
  }
  if (resJson.error) {
    throw `AnkiConnect error: ${resJson.error}`;
  }
  return resJson.result;
}

export async function acCanConnect(): Promise<boolean> {
  try {
    const res = await fetch(AC_ENDPOINT);
    return (await res.text()).startsWith("AnkiConnect");
  } catch (e) {
    console.log("Error while checking AnkiConnect connectivity:", e)
    return false;
  }
}
