import puppeteer from 'puppeteer';
import formidable from 'formidable';
import Cors from 'cors';
import fetch from 'node-fetch';

const PANEL_USERNAME = 'SYDNEY99999';
const PANEL_PASSWORD = 'Vintage#1234';
const T_PASS = '222500';
const URL = "https://tiger365.me";

async function generate_random_string(length) {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}

const cors = Cors({
	origin: '*',
	methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
	credentials: true,
});

function runMiddleware(req, res, fn) {
	return new Promise((resolve, reject) => {
		fn(req, res, (result) => {
			if (result instanceof Error) {
				return reject(result);
			}
			return resolve(result);
		});
	});
}

export const config = {
	api: {
		bodyParser: false,
	},
};

let browser;
let page;
let engine;
var requests = [];
var REQUEST_ID = 1;
var engineOn = false;

async function launchBrowser() {
	if (!browser) {
		browser = await puppeteer.launch({ headless: process.env.HEADLESS });
		page = await browser.newPage();
		await page.setViewport({ width: 1080, height: 1024 });
		await page.goto(`${URL}/login`);
		await new Promise(resolve => setTimeout(resolve, 500));
	}

	if (!page) {
		page = await browser.newPage();
		await page.setViewport({ width: 1080, height: 1024 });
		await page.goto(`${URL}/login`);
	}
	return page;
}

async function requestHandler(req, res, type) {
	const form = formidable();
	form.parse(req, async (error, fields) => {
		if (error) {
			return res.status(200).json({ response: 'error', message: 'form_request_invalid' });
		}
		else {
			res.status(200).json({
				response: 'ok'
			});

			var { user_id, channel, remarks, amount, aff_user_id, activity_id, c_username } = fields;
			var request_id = REQUEST_ID;

			var user_id = (user_id && user_id[0]) || false;
			var channel = (channel && channel[0]) || false;
			var activity_id = (activity_id && activity_id[0]) || false;
			var username = (c_username && c_username[0]) || false;
			var aff_user_id = (aff_user_id && aff_user_id[0]) || false;
			var remarks = (remarks && remarks[0]) || false;
			var amount = (amount && amount[0]) || false;

			var newRequest = {
				request_id,
				type,
				user_id,
				channel,
				aff_user_id,
				remarks,
				amount,
				activity_id,
				username
			}

			requests.push(newRequest);
			setTimeout(async () => {
				if (!engineOn) {
					await requestEngine();
				}
			}, 0);

			res.status(200).json({
				response: 'ok',
			});
		}
	});
}

async function requestEngine() {
	if (requests.length > 0) {
		engineOn = true;
		var item = requests[0];
		var { type } = item;
		if (type == 'create') {
			console.log('STARTED_HANDLING_CREATE_REQUEST');
			createNewUser(item);
		}
		else if (type == 'deposit') {
			console.log('STARTED_HANDLING_DEPOSIT_REQUEST');
			deposit(item);
		}
		else if (type == "withdraw") {
			console.log('STARTED_HANDLING_WITHDRAW_REQUEST');
			withdraw(item);
		}
	}
	else {
		engineOn = false;
		console.log('🛌🏼 ENGINE OFF, NO_MORE_REQUESTS_TO_PROCESS');
	}
}

async function createNewUser(item) {
	var { user_id, aff_user_id, request_id } = item;
	var client_username = `v${user_id}${await generate_random_string(5)}`;
	var client_password = `#V1n${await generate_random_string(8)}`;

	if (aff_user_id) {
		try {
			const newPage = await browser.newPage();
			await newPage.goto(`${URL}/backend/users/create/1194030/client`, { waitUntil: 'networkidle2' });
			await newPage.type('input[name="name"]', client_username);
			await newPage.type('input[name="username"]', client_username);
			await newPage.type('input[name="password"]', client_password);
			await newPage.type('input[name="password_confirmation"]', client_password);
			await new Promise(resolve => setTimeout(resolve, 100));
			await newPage.keyboard.press('Enter');
			await newPage.waitForSelector('.card.green.error-message', { timeout: 15000 });
			const successMessage = await newPage.evaluate(() => {
				const card = document.querySelector('.card.green.error-message');
				if (card) {
					const text = card.innerText.trim();
					return text.includes("User Created!") ? text : null;
				}
				return null;
			});

			console.log('1 BOT REQUEST COMPELTED');
			if (successMessage) {
				console.log("✅ User Created!");
				// PHP API;
				var formData = new FormData();
				formData.append('username', client_username);
				formData.append('password', client_password);
				formData.append('status', '1');

				await fetch(`${process.env.MAIN_URL}/affiliate_user?id=${aff_user_id}`, {
					method: "POST",
					headers: {
						"Authorization": 1,
					},
					body: formData,
				}).then((result) => {
					result.json().then(
						async (resp) => {
							if (resp.response == "ok") {
								console.log('1 REQUEST PROCESSED', request_id);
								requests = requests.filter(req => req.request_id !== request_id);
								await newPage.close();
								console.log('Restarting Engine');
								requestEngine();
							}
							else {
								console.log('1 REQUEST FAILED', request_id);
								requests = requests.filter(req => req.request_id !== request_id);
								requestEngine();
							}
						}
					)
				});
			} else {
				console.log("❌ Failed to create user!");
			}
		} catch (error) {
			console.log('1 REQUEST FAILED', request_id);
			requests = requests.filter(req => req.request_id !== request_id);
			requestEngine();
			console.log(error);
		}
	}
}

async function deposit(item) {
	var { request_id, amount, activity_id, username } = item;
	if (request_id && amount && activity_id && username) {
		if (amount) {
			try {
				const newPage = await browser.newPage();
				await page.setViewport({ width: 1440, height: 900 });
				await newPage.goto(`${URL}/backend/users/child/1194030/${username}/`, { waitUntil: 'networkidle2' });
				var oldUrl = newPage.url();

				try {
					await newPage.click('.btn_deposit');

				} catch (error) {
					await newPage.click('.dropdown-trigger');
					await newPage.evaluate(() => {
						const links = document.querySelectorAll("a");
						for (let link of links) {
							if (link.textContent.trim() === "Bank Deposit") {
								link.click();
								break;
							}
						}
					});
				}

				await newPage.waitForFunction(oldUrl => window.location.href !== oldUrl, {}, oldUrl);
				await newPage.type('input[name="amount"]', amount);
				await newPage.type('input[name="note"]', 'GB');
				await newPage.keyboard.press('Enter');
				await newPage.waitForSelector('.card.red.error-message', { timeout: 15000 });
				const successMessage = await newPage.evaluate(() => {
					const card = document.querySelector('.card.red.error-message');
					if (card) {
						const text = card.innerText.trim();
						return text.includes("Bank Deposit Done!") ? text : null;
					}
					return null;
				});

				if (successMessage) {
					updateTransaction(activity_id, request_id, newPage);
				}
				else {
					console.log('❌ 1 REQUEST FAILED', activity_id);
					requests = requests.filter(req => req.request_id !== request_id);
					requestEngine();
				}
			} catch (error) {
				console.log('❌ 1 REQUEST FAILED', activity_id);
				requests = requests.filter(req => req.request_id !== request_id);
				requestEngine();
				console.log(error);
			}
		}
	}
}

async function withdraw(item) {
	var { request_id, amount, activity_id, username } = item;
	if (request_id && amount && activity_id && username) {
		if (amount) {
			try {
				const newPage = await browser.newPage();
				await page.setViewport({ width: 1440, height: 900 });
				await newPage.goto(`${URL}/backend/users/child/1194030/${username}/`, { waitUntil: 'networkidle2' });
				var oldUrl = newPage.url();

				try {
					await newPage.click('.btn_withdraw');

				} catch (error) {
					await newPage.click('.dropdown-trigger');
					await newPage.evaluate(() => {
						const links = document.querySelectorAll("a");
						for (let link of links) {
							if (link.textContent.trim() === "Bank Withdraw") {
								link.click();
								break;
							}
						}
					});
				}

				await newPage.waitForFunction(oldUrl => window.location.href !== oldUrl, {}, oldUrl);
				await newPage.type('input[name="amount"]', amount);
				await newPage.type('input[name="note"]', 'GB');
				await newPage.keyboard.press('Enter');
				await newPage.waitForSelector('.card.green.error-message', { timeout: 15000 });
				const successMessage = await newPage.evaluate(() => {
					const card = document.querySelector('.card.green.error-message');
					if (card) {
						const text = card.innerText.trim();
						return text.includes("Bank Withdrawal Success") ? text : null;
					}
					return null;
				});

				if (successMessage) {
					updateTransaction(activity_id, request_id, newPage);
				}
				else {
					console.log('❌ 1 REQUEST FAILED', activity_id);
					requests = requests.filter(req => req.request_id !== request_id);
					requestEngine();
				}
			} catch (error) {
				console.log('❌ 1 REQUEST FAILED', activity_id);
				requests = requests.filter(req => req.request_id !== request_id);
				requestEngine();
				console.log(error);
			}
		}
	}
}

async function updateTransaction(activity_id, request_id, newPage) {
	var formData = new FormData();
	formData.append('activity_id', activity_id);
	formData.append('status', '1');
	formData.append('note', 'GB');

	await fetch(`${process.env.MAIN_URL}/up_trans_request?id=${activity_id}`, {
		method: "POST",
		headers: {
			"Authorization": 1,
		},
		body: formData,
	}).then((result) => {
		result.json().then(
			async (resp) => {
				if (resp.response == "ok") {
					console.log('✅ 1 REQUEST PROCESSED', activity_id);
					requests = requests.filter(req => req.request_id !== request_id);
					await newPage.close();
					console.log('Restarting Engine');
					requestEngine();
				}
				else {
					console.log('❌ 1 REQUEST FAILED', activity_id);
					requests = requests.filter(req => req.request_id !== request_id);
					requestEngine();
					console.log(error);
				}
			}
		)
	});
}

export default async function handler(req, res) {
	await runMiddleware(req, res, cors);
	if (req.method == "POST") {
		var { type, testflight } = req.query;
		REQUEST_ID++
		if (type && ["create", "deposit", "withdraw"].includes(type)) {
			try {
				if (!testflight) {
					console.log('1_NEW_REQUEST_TYPE', type);
					const page = await launchBrowser();
					var currentUrl = page.url();
					if (currentUrl === `${URL}/login`) {
						console.log('TRYING LOGIN');
						await page.click('#login_modal_btn');
						await new Promise(resolve => setTimeout(resolve, 1000));
						await page.type('#username', PANEL_USERNAME);
						await page.type('#password', PANEL_PASSWORD);
						await page.keyboard.press('Enter');
						console.log('⏳ LOGIN UNDER PROCESS');
						await page.waitForNavigation({ waitUntil: 'networkidle2' });

						var newUrl = page.url();
						if (newUrl !== `${URL}/login`) {
							console.log('✅ LOGGEDIN_SUCCESSFULLY');
							await requestHandler(req, res, type);
						}
						else {
							console.log('❌ LOGIN FAILED');
							res.status(200).json({
								response: 'error',
								message: 'UNABLE TO LOGIN',
							});
						}
					}
					else {
						console.log('✅ ALREADY LOGGEDIN');
						await requestHandler(req, res, type);
					}
				}
				else {
					res.status(200).json({
						response: 'ok',
						mode: 'test',
						requests,
					});
				}
			}
			catch (error) {
				console.log(error);
				res.status(200).json({ response: 'error', message: "CATCH", error: error });
			}
		}
		else {
			res.status(200).json({
				response: 'error',
				message: "type_err"
			});
		}
	}
	else {
		res.status(200).json({
			response: 'error',
			message: "method_err"
		});
	}
}