import fs from "fs";
import { cwd } from "process";
import { BlueButton } from ".";
import { Environments } from ".";

test("expect bb sdk to be created with appropriate defaults", () => {
  const CLIENT_ID = "foo";
  const CLIENT_SECRET = "bar";
  const CALLBACK_URL = "https://www.fake.com/";

  const bb = new BlueButton({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackUrl: CALLBACK_URL,
  });

  expect(bb.clientId).toBe(CLIENT_ID);
  expect(bb.clientSecret).toBe(CLIENT_SECRET);
  expect(bb.version).toBe("2");
  expect(bb.baseUrl).toBe(`https://sandbox.bluebutton.cms.gov`);
});

test("expect bb sdk to be created with the supplied version", () => {
  const CLIENT_ID = "foo";
  const CLIENT_SECRET = "bar";
  const CALLBACK_URL = "https://www.fake.com/";
  const VERSION = "1";

  const bb = new BlueButton({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackUrl: CALLBACK_URL,
    version: VERSION,
  });

  expect(bb.clientId).toBe(CLIENT_ID);
  expect(bb.clientSecret).toBe(CLIENT_SECRET);
  expect(bb.version).toBe(VERSION);
  expect(bb.baseUrl).toBe(`https://sandbox.bluebutton.cms.gov`);
});

test("expect bb sdk to be created the appropriate baseUrl that corresponds to the provided environment", () => {
  const CLIENT_ID = "foo";
  const CLIENT_SECRET = "bar";
  const CALLBACK_URL = "https://www.fake.com/";

  const bb = new BlueButton({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackUrl: CALLBACK_URL,
    environment: Environments.PRODUCTION,
  });

  expect(bb.clientId).toBe(CLIENT_ID);
  expect(bb.clientSecret).toBe(CLIENT_SECRET);
  expect(bb.callbackUrl).toBe(CALLBACK_URL);
  expect(bb.version).toBe("2");
  expect(bb.baseUrl).toBe(`https://api.bluebutton.cms.gov`);
});

test("empty constructor should use top level .bluebutton-config.json file (if exists)", () => {
  const CLIENT_ID = "foo";
  const CLIENT_SECRET = "bar";
  const VERSION = "1";

  const pathToFile = `${cwd()}/.bluebutton-config.json`;

  try {
    new BlueButton();
  } catch (e) {
    expect(e).toEqual(
      new Error(`Failed to load config file at: ${pathToFile}`)
    );
  }

  fs.copyFileSync(
    __dirname + "/testConfigs/.bluebutton-config.json",
    pathToFile
  );

  const bb = new BlueButton();

  expect(bb.clientId).toBe(CLIENT_ID);
  expect(bb.clientSecret).toBe(CLIENT_SECRET);
  expect(bb.version).toBe(VERSION);
  expect(bb.baseUrl).toBe(`https://api.bluebutton.cms.gov`);

  fs.unlinkSync(pathToFile);
});

test("string constructor arg should be the path to a json config file it should load that", () => {
  const CLIENT_ID = "hello";
  const CLIENT_SECRET = "world";
  const VERSION = "1";

  const bb = new BlueButton(
    `${__dirname}/testConfigs/.custom-bluebutton-config.json`
  );

  expect(bb.clientId).toBe(CLIENT_ID);
  expect(bb.clientSecret).toBe(CLIENT_SECRET);
  expect(bb.version).toBe(VERSION);
  expect(bb.baseUrl).toBe(`https://api.bluebutton.cms.gov`);
});

test("should throw a helpful error if there a string constructor is used that cant be resolved to a file location", () => {
  const pathToFile = `${__dirname}/notRealDirectory/.bluebutton-config.json`;

  try {
    new BlueButton(pathToFile);
  } catch (e) {
    expect(e).toEqual(
      new Error(`Failed to load config file at: ${pathToFile}`)
    );
  }
});

test("should throw a helpful error if no client id is provided", () => {
  try {
    new BlueButton(`${__dirname}/testConfigs/.missing-client-id-config.json`);
  } catch (e) {
    expect(e).toEqual(new Error(`clientId is required`));
  }
});

test("should throw a helpful error if no client secret is provided", () => {
  try {
    new BlueButton(
      `${__dirname}/testConfigs/.missing-client-secret-config.json`
    );
  } catch (e) {
    expect(e).toEqual(new Error(`clientSecret is required`));
  }
});

test("should throw a helpful error if no callbackUrl is provided", () => {
  try {
    new BlueButton(
      `${__dirname}/testConfigs/.missing-callback-url-config.json`
    );
  } catch (e) {
    expect(e).toEqual(new Error(`callbackUrl is required`));
  }
});

test("expect bb sdk to be created with config as object", () => {
  const CLIENT_ID = "foo";
  const CLIENT_SECRET = "bar";
  const CALLBACK_URL = "https://www.fake.com/";

  //    '{"baseUrl": "https://api.bluebutton.cms.gov",' +
  const blueButtonConfig =
    '{"clientId": "' +
    CLIENT_ID +
    '" ,"clientSecret": "' +
    CLIENT_SECRET +
    '", "callbackUrl": "' +
    CALLBACK_URL +
    '", "version":"2", "environment": "PRODUCTION"}';

  const blueButtonConfigObj = JSON.parse(blueButtonConfig);
  const bb = new BlueButton(blueButtonConfigObj);

  expect(bb.clientId).toBe(CLIENT_ID);
  expect(bb.clientSecret).toBe(CLIENT_SECRET);
  expect(bb.callbackUrl).toBe(CALLBACK_URL);
  expect(bb.version).toBe("2");
  expect(bb.baseUrl).toBe(`https://api.bluebutton.cms.gov`);
});
