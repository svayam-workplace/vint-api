import puppeteer from 'puppeteer';
import formidable from 'formidable';
import Cors from 'cors';
import fetch from 'node-fetch';

const PANEL_USERNAME = 'dubai1212';
const PANEL_PASSWORD = 'mnbv1234';
const T_PASS = '222500';
const URL = "https://admin.sevenbook247.com";
const L_URL = "https://admin.sevenbook247.com/";

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
		await page.goto(URL);
		await new Promise(resolve => setTimeout(resolve, 500));
	}

	if (!page) {
		page = await browser.newPage();
		await page.setViewport({ width: 1080, height: 1024 });
		await page.goto(URL);
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
		const page = await launchBrowser();
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
	var client_username = `v${await generate_random_string(4)}${user_id}`;
	var client_password = `#V1n${await generate_random_string(8)}`;

	if (aff_user_id) {
		try {
			// const newPage = await browser.newPage();
			const newPage = page;
			await newPage.waitForSelector('.ng-binding', { timeout: 15000 });
			await newPage.evaluate(() => {
				const links = document.querySelectorAll("a");
				for (let link of links) {
					if (link.textContent.trim() === "Member Listing") {
						link.click();
						break;
					}
				}
			});

			await newPage.waitForSelector('#createAgent', { timeout: 15000 });
			await newPage.click('#createAgent');

			await newPage.waitForSelector('input.qa-loginName', { visible: true });
			await newPage.type('.qa-loginName', client_username);

			await newPage.waitForSelector('.qa-password', { visible: true });
			await newPage.type('.qa-password', client_password);
			await newPage.type('.qa-password-verify', client_password);

			await newPage.waitForSelector('.ng-pristine', { visible: true });
			await newPage.type('.ng-pristine', 'GB');

			await newPage.waitForSelector('.qa-creditlimit', { visible: true });
			await newPage.type('.qa-creditlimit', '0');

			await newPage.waitForSelector('.qa-parentPosition', { visible: true });
			await newPage.type('.qa-parentPosition', '0');
			await newPage.keyboard.press('Enter');

			await newPage.waitForSelector('.type-NOTICE', { visible: true });
			const message = await newPage.evaluate(() => {
				const card = document.querySelector('.type-NOTICE');
				if (card) {
					const text = card.innerText.trim();
					return text.includes("Member was created successfully.") ? text : null;
				}
				return null;
			});

			console.log('1 BOT REQUEST COMPELTED');
			if (message) {
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
								console.log('✅ 1 REQUEST PROCESSED', request_id);
								requests = requests.filter(req => req.request_id !== request_id);
								console.log('Restarting Engine');
								requestEngine();
							}
							else {
								console.log('❌ 1 REQUEST FAILED', request_id);
								requests = requests.filter(req => req.request_id !== request_id);
								requestEngine();
							}
						}
					)
				});
			} else {
				await newPage.close();
				page = false;
				console.log("❌ Failed to create user!");
				requests = requests.filter(req => req.request_id !== request_id);
				console.log('Restarting Engine');
				requestEngine();
			}
		} catch (error) {
			await newPage.close();
			page = false;
			console.log('1 REQUEST FAILED', request_id);
			requests = requests.filter(req => req.request_id !== request_id);
			requestEngine();
			console.log(error);
		}
	}
	else {
		await newPage.close();
		page = false;
		console.log('1 REQUEST FAILED', request_id);
		requests = requests.filter(req => req.request_id !== request_id);
		requestEngine();
		console.log(error);
	}
}

async function deposit(item) {
	var { request_id, amount, activity_id, username } = item;
	if (request_id && amount && activity_id && username) {
		if (amount) {
			try {
				const newPage = page;
				await newPage.waitForSelector('.ng-binding', { timeout: 15000 });
				await newPage.evaluate(() => {
					const links = document.querySelectorAll("a");
					for (let link of links) {
						if (link.textContent.trim() === "Member Listing") {
							link.click();
							break;
						}
					}
				});

				await newPage.type('#username', username);
				await new Promise(resolve => setTimeout(resolve, 1000));
				await newPage.keyboard.press('Enter');

				await new Promise(resolve => setTimeout(resolve, 2000));
				await newPage.waitForSelector('tbody tr:nth-child(2) td:nth-child(1)', { timeout: 10000 });
				await newPage.click(`tbody tr:nth-child(2) td:nth-child(1) a`);

				await newPage.waitForSelector('.qa-creditlimit', { visible: true });
				var creditLimit = await newPage.evaluate(() => {
					const inputElement = document.querySelector(".qa-creditlimit");
					return inputElement ? inputElement.value.trim() : null;
				});


				var creditLimit = Number(creditLimit);
				if (creditLimit || creditLimit == 0) {
					var newAmount = Number(creditLimit) + Number(amount);
					var newAmount = Number(newAmount);
					var newAmount = newAmount.toString()
					console.log(newAmount);
					await newPage.waitForSelector('.qa-creditlimit', { timeout: 5000 });
					await newPage.focus('.qa-creditlimit');
					await newPage.keyboard.press('Backspace');
					await newPage.keyboard.press('Backspace');
					await newPage.keyboard.press('Backspace');
					await newPage.keyboard.press('Backspace');
					await newPage.keyboard.press('Backspace');
					await newPage.keyboard.press('Backspace');
					await newPage.keyboard.press('Backspace');
					await newPage.keyboard.press('Backspace');
					await newPage.keyboard.press('Backspace');
					await newPage.keyboard.press('Backspace');
					await newPage.keyboard.press('Backspace');
					await newPage.keyboard.press('Backspace');
					await newPage.keyboard.press('Backspace');
					await newPage.type('.qa-creditlimit', newAmount);

					await newPage.keyboard.press('Enter');
					await newPage.waitForSelector('.type-NOTICE', { visible: true });
					const message = await newPage.evaluate(() => {
						const card = document.querySelector('.type-NOTICE');
						if (card) {
							const text = card.innerText.trim();
							return text.includes("Member was updated successfully.") ? text : null;
						}
						return null;
					});

					if (message) {
						updateTransaction(activity_id, request_id, newPage);
					}
					else {
						await newPage.close();
						page = false;
						console.log('❌ 1 REQUEST FAILED', activity_id);
						requests = requests.filter(req => req.request_id !== request_id);
						requestEngine();
					}
				}
			} catch (error) {
				await newPage.close();
				page = false;
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
				const newPage = page;
				await newPage.waitForSelector('.ng-binding', { timeout: 15000 });
				await newPage.evaluate(() => {
					const links = document.querySelectorAll("a");
					for (let link of links) {
						if (link.textContent.trim() === "Member Listing") {
							link.click();
							break;
						}
					}
				});

				await newPage.type('#username', username);
				await new Promise(resolve => setTimeout(resolve, 1000));
				await newPage.keyboard.press('Enter');

				await new Promise(resolve => setTimeout(resolve, 2000));
				await newPage.waitForSelector('tbody tr:nth-child(2) td:nth-child(1)', { timeout: 10000 });
				await newPage.click(`tbody tr:nth-child(2) td:nth-child(1) a`);

				await newPage.waitForSelector('.qa-creditlimit', { visible: true });
				var creditLimit = await newPage.evaluate(() => {
					const inputElement = document.querySelector(".qa-creditlimit");
					return inputElement ? inputElement.value.trim() : null;
				});


				var creditLimit = Number(creditLimit);
				if (creditLimit && creditLimit !== 0) {
					var newAmount = Number(creditLimit) - Number(amount);
					var newAmount = Number(newAmount);
					if (newAmount && newAmount >= 0) {
						var newAmount = newAmount.toString()
						console.log(newAmount);
						await newPage.waitForSelector('.qa-creditlimit', { timeout: 5000 });
						await newPage.focus('.qa-creditlimit');
						await newPage.keyboard.press('Backspace');
						await newPage.keyboard.press('Backspace');
						await newPage.keyboard.press('Backspace');
						await newPage.keyboard.press('Backspace');
						await newPage.keyboard.press('Backspace');
						await newPage.keyboard.press('Backspace');
						await newPage.keyboard.press('Backspace');
						await newPage.keyboard.press('Backspace');
						await newPage.keyboard.press('Backspace');
						await newPage.keyboard.press('Backspace');
						await newPage.keyboard.press('Backspace');
						await newPage.keyboard.press('Backspace');
						await newPage.keyboard.press('Backspace');
						await newPage.type('.qa-creditlimit', newAmount);

						await newPage.keyboard.press('Enter');
						await newPage.waitForSelector('.type-NOTICE', { visible: true });
						const message = await newPage.evaluate(() => {
							const card = document.querySelector('.type-NOTICE');
							if (card) {
								const text = card.innerText.trim();
								return text.includes("Member was updated successfully.") ? text : null;
							}
							return null;
						});

						if (message) {
							updateTransaction(activity_id, request_id, newPage);
						}
						else {
							await newPage.close();
							page = false;
							console.log('❌ 1 REQUEST FAILED', activity_id);
							requests = requests.filter(req => req.request_id !== request_id);
							requestEngine();
						}
					}
					else {
						await newPage.close();
						page = false;
						console.log('❌ 1 REQUEST FAILED', activity_id);
						requests = requests.filter(req => req.request_id !== request_id);
						requestEngine();
					}
				}
			} catch (error) {
				await newPage.close();
				page = false;
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
					console.log(page.url())
					if ((currentUrl === L_URL) || currentUrl === `${currentUrl}#/`) {
						console.log('TRYING LOGIN');
						await page.waitForSelector('#username', { timeout: 15000 });
						await page.type('#username', PANEL_USERNAME);
						await page.type('#password', PANEL_PASSWORD);
						await page.keyboard.press('Enter');
						console.log('⏳ LOGIN UNDER PROCESS');
						await page.waitForNavigation({ waitUntil: 'networkidle2' });
						var newUrl = page.url();
						if (newUrl !== L_URL) {
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