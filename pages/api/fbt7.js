import puppeteer from 'puppeteer';
import formidable from 'formidable';
import Cors from 'cors';
import fetch from 'node-fetch';

const PANEL_USERNAME = '5vob00443';
const PANEL_PASSWORD = 'Mnbv1234';
const T_PASS = '458925';
const URL = "https://fairbet777.com";

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
		await page.goto(`${URL}/admin`);
		await new Promise(resolve => setTimeout(resolve, 500));
	}

	if (!page) {
		page = await browser.newPage();
		await page.setViewport({ width: 1080, height: 1024 });
		await page.goto(`${URL}/admin`);
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
			await newPage.goto(`${URL}/admin/users/insertuser`, { waitUntil: 'networkidle2' });
			await newPage.type('input[name="fullname"]', client_username);
			await newPage.type('input[name="username"]', client_username);
			await newPage.type('input[name="password"]', client_password);
			await newPage.type('input[name="cpassword"]', client_password);
			await new Promise(resolve => setTimeout(resolve, 100));
			await newPage.select('select[name="newlvlno"]', '7');
			await new Promise(resolve => setTimeout(resolve, 300));
			await newPage.type('input[name="mpassword"]', T_PASS);
			await newPage.keyboard.press('Enter');
			await new Promise(resolve => setTimeout(resolve, 500));
			// await newPage.waitForFunction(oldUrl => window.location.href !== oldUrl, {}, oldUrl);

			var currentUrl = newPage.url();
			if (currentUrl === `${URL}/admin/activeusers`) {
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
				await newPage.goto(`${URL}/admin/users`, { waitUntil: 'networkidle2' });
				await newPage.type('input[name="searchKey"]', username);
				await newPage.keyboard.press('Enter');

				await new Promise(resolve => setTimeout(resolve, 1200));
				await newPage.waitForSelector('.text-warning', { timeout: 10000 });
				await newPage.click(`.text-warning`);
				await new Promise(resolve => setTimeout(resolve, 800));

				await newPage.waitForSelector('input[name="userCreditUpdateamount"]', { timeout: 15000 });

				await newPage.type('input[name="userCreditUpdateamount"]', amount);
				await newPage.type('textarea[name="userCreditUpdateremark"]', 'GB');
				await newPage.type('input[name="userCreditUpdatempassword"]', T_PASS);
				await newPage.keyboard.press('Enter');

				await newPage.waitForSelector('#swal2-content', { timeout: 15000 });
				const content = await newPage.evaluate(() => {
					return document.querySelector('#swal2-content')?.innerHTML || "Not Found";
				});

				if (content == "Sucessfull Balance Transfer") {
					updateTransaction(activity_id, request_id, newPage);
				} else {
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
				await newPage.goto(`${URL}/admin/users`, { waitUntil: 'networkidle2' });
				await newPage.type('input[name="searchKey"]', username);
				await newPage.keyboard.press('Enter');

				await new Promise(resolve => setTimeout(resolve, 1200));
				await newPage.waitForSelector('.text-warning', { timeout: 10000 });
				await newPage.click(`.text-warning`);
				await new Promise(resolve => setTimeout(resolve, 800));

				await newPage.waitForSelector('ul.nav-tabs', { visible: true, timeout: 5000 });
				await newPage.click(`ul.nav-tabs li:nth-child(2) a`);

				await newPage.waitForSelector('input[name="userWithdrawCreditUpdateamount"]', { timeout: 15000 });

				await newPage.type('input[name="userWithdrawCreditUpdateamount"]', amount);
				await newPage.type('textarea[name="userWithdrawCreditUpdateremark"]', 'GB');
				await newPage.type('input[name="userWithdrawCreditUpdatempassword"]', T_PASS);
				await newPage.keyboard.press('Enter');


				await newPage.waitForSelector('#swal2-content', { timeout: 15000 });
				const content = await newPage.evaluate(() => {
					return document.querySelector('#swal2-content')?.innerHTML || "Not Found";
				});

				if (content == "Sucessfull Balance Transfer") {
					updateTransaction(activity_id, request_id, newPage);
				} else {
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
					if (currentUrl === `${URL}/admin`) {
						console.log('TRYING LOGIN');
						await page.waitForSelector('.btn.btn-primary.login-btn',{timeout: 15000});
						await page.click('.btn.btn-primary.login-btn');
						await new Promise(resolve => setTimeout(resolve, 1000));
						await page.type('#input-1', PANEL_USERNAME);
						await page.type('#input-2', PANEL_PASSWORD);
						await page.keyboard.press('Enter');
						console.log('⏳ LOGIN UNDER PROCESS');
						await page.waitForNavigation({ waitUntil: 'networkidle2' });

						var newUrl = page.url();
						if (newUrl !== `${URL}/admin`) {
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