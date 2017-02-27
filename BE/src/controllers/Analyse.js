import Record from '../models/Record'
import GoalUserMap from '../models/GoalUserMap'

import {getToday, getMonthBegin, getMonthEnd, ONE_DAY} from './util/util'

exports.analyse = (req, res, next) => {
	let userId = req.user._id;
	let today = getToday(),
			begin = getMonthBegin(today),
			end = getMonthEnd(begin);

	let promises = [];
	promises.push(getGoalsFinishedInfo(userId, begin, end));
	promises.push(getGoalsCreated(userId, begin, end));
	promises.push(getGoalsDoing(userId));
	promises.push(getGoalsFinished(userId, begin, end));
	promises.push(getGoalsUnfinished(userId, begin, end));
	promises.push(getLongestGoal(userId, begin, end));

	Promise.all(promises).then(data => {
		res.json({code: 10000, msg: '', data: {
			goalsFinishedRecord: data[0],
			goalsCreated: data[1],
			goalsDoing: data[2],
			goalsFinished: data[3],
			goalsUnfinished: data[4],
			longestGoal: data[5]
		}})
	}, err => {
		console.log(err);
		res.json({code: 10500, msg: '服务器出错'});
	})
}

/**
 * 获取[begin, end]目标每日完成数量情况
 * @return [
 * 	{
 * 		date: , // 记录日期
 * 		nums: // 当天完成目标数量
 * 	}
 * ]
 */
let getGoalsFinishedInfo = (userId, begin, end) => new Promise((resolve, reject) => {
	Record.find({user: userId, date: {$gte: begin, $lte: end}}, (err, records) => {
		if (err) {
			console.log(err);
			records = [];
		}
		resolve(records.map(record => {
			return {
				date: record.date,
				nums: record.goalsFinished.length
			}
		}));
	})
})

/*
	获取[begin, end]创建目标
 */
let getGoalsCreated = (userId, begin, end) => getGoals({"meta.createAt": {$gte: begin, $lte: end}});

/*
 获取正在进行的目标数量
 */
let getGoalsDoing = userId => getGoals({finish: false});

/*
	获取本月标记目标完成数量
 */
let getGoalsFinished = (userId, begin, end) => getGoals({end: {$gte: begin, $lte: end}});

/*
	获取本月关注且未完成的目标
 */
let getGoalsUnfinished = (userId, begin, end) => getGoals({"meta.createAt": {$gte: begin, $lte: end}, finish: false});

/*
	获取本月坚持最久的目标
 */
let getLongestGoal = (userId, begin, end) => new Promise((resolve, reject) => {
	// 查询[begin, end]每日目标完成情况
	Record.find({
		user: userId, date: {$gte: begin, $lte: end}},
		{date: 1, goalsFinished: 1},
		{sort: {date: 1}},
		(err, records) => {
			if (err) {
				console.log(err);
				records = [];
			}
			let goals = {},
					lastDate;
			for (let i = 0; i < records.length; ++i) {
				let {date, goalsFinished} = records[i];
				/*
					判断记录是否连续(即lastDate == undefined 或者 两者日期相差一天)
				 */
				let isContinued = (!lastDate || date - lastDate == ONE_DAY);
				lastDate = date;

				// 将不在 goals 数组中的目标添加进去
				for (let i = 0; i < goalsFinished.length; i++) {
					if (!goals[goalsFinished[i]]) {
						goals[goalsFinished[i]] = {
							current: 0, // 当前连续天数
							max: 0 // 当前最大连续天数
						};
					}
				}

				// 计算连续天数
				for (let key in goals) {
					let isExisted = goalsFinished.indexOf(key) != -1;
					if (isExisted && (goals[key].current == 0 || isContinued)) {
						goals[key].current++;
					} else {
						goals[key].max = Math.max(goals[key].max, goals[key].current);
						goals[key].current = 0;
					}
				}
			}

			// 统计最大天数, 并加入goalsArray
			let goalsArray = [];
			for (let key in goals) {
				goalsArray.push({
					goalId: key, // Goal记录的_id值
					numOfDay: Math.max(goals[key].max, goals[key].current)// 最大坚持天数
				})
			}
			
			resolve(goalsArray.sort((g1, g2) => g1.numOfDay < g2.numOfDay)); // 递减排序
	})
})

/**
 * 根据指定条件查找目标
 */
let getGoals = condition => new Promise((resolve, reject) => {
	GoalUserMap.find(condition)
		.populate({path: 'goal', populate: {path: 'user', select: {name: 1, avatar: 1}}})
		.exec((err, goalUserMaps) => {
			if (err) {
				console.log(err);
				goalUserMaps = [];
			}
			resolve(goalUserMaps.map(goalUserMap => goalUserMap.goal));
	})
})