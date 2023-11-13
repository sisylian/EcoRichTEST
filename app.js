const express = require('express')
const mysql = require('mysql');
const request = require('request');
const app = express()
const port = 3000
const conn = mysql.createConnection({
  host : '로컬아이피',
  user : 'simon',
  password : '비밀번호',
  database : 'hr'
})

const { swaggerUi, specs } = require("./swagger")

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))

app.get('/', (req, res) => {
  res.send('Simon Work Test')
})

/**
 * @swagger
 * paths:
 *  /info/{id}:
 *    get:
 *      summary: "특정 사원의 현재 정보 조회"
 *      description: "특정 사원의 현재 정보 조회"
 *      tags: [Users]
 *      parameters:
 *        - in : path
 *          name : id
 *          required : true
 *          description : 사원아이디
 *          schema:
 *            type : int
 *      responses:
 *        "200":
 *          description: 사원정보
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 */
app.get('/info/:id', (req, res) => {
  //특정 사원의 현재정보 조회
  let { id } = req.params;
  res.header("Access-Control-Allow-Origin" , "*")
  conn.query('SELECT * from employees where employee_id=?;', [id], (error, rows, fields) => {
    if (error) throw error;
    console.log('info: ', rows);
    res.json(rows);
  });
})

/**
 * @swagger
 * paths:
 *  /history/{id}:
 *    get:
 *      summary: "특정 사원의 이력 정보 조회"
 *      description: "특정 사원의 이력 정보 조회"
 *      tags: [Users]
 *      parameters:
 *        - in : path
 *          name : id
 *          required : true
 *          description : 사원아이디
 *          schema:
 *            type : int
 *      responses:
 *        "200":
 *          description: 사원히스토리
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 */
app.get('/history/:id', (req, res) => {
  //특정 사원의 이력정보 조회
  let { id } = req.params;
  res.header("Access-Control-Allow-Origin" , "*")
  conn.query('select a.*, b.department_name, b.manager_id from job_history a join departments b on a.department_id=b.department_id where a.employee_id=? order by a.start_date desc;', [id], (error, rows, fields) => {
    if (error) throw error;
    console.log('history: ', rows);
    res.json(rows);
  });
})

/**
 * @swagger
 * paths:
 *  /departments/{id}:
 *    get:
 *      summary: "부서 및 위치 정보 조회"
 *      description: "부서 및 위치 정보 조회"
 *      tags: [Departments]
 *      parameters:
 *        - in : path
 *          name : id
 *          required : true
 *          description : 부서아이디
 *          schema:
 *            type : int
 *      responses:
 *        "200":
 *          description: 부서 및 위치 정보 
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 */
app.get('/departments/:id', (req, res) => {
  //부서 및 위치정보 조회
  let { id } = req.params;
  res.header("Access-Control-Allow-Origin" , "*")
  conn.query('select a.*, b.street_address, b.postal_code, b.city, b.state_province, b.country_id from departments a join locations b on a.location_id=b.location_id where a.department_id=?;', [id], (error, rows, fields) => {
    if (error) throw error;
    console.log('departments: ', rows);
    res.json(rows);
  });
})

/**
 * @swagger
 * paths:
 *  /payupdate/{name}/{avg}:
 *    get:
 *      summary: "특정 부서의 급여를 특정 비율로 인상 및 사원 정보 업데이트"
 *      description: "특정 부서의 급여를 특정 비율로 인상 및 사원 정보 업데이트, 해당 직급의 최대급여 이상은 업데이트 되지 않도록 조정"
 *      tags: [Departments]
 *      parameters:
 *        - in : path
 *          name : name
 *          required : true
 *          description : 부서명
 *          schema:
 *            type : string
 *        - in : path
 *          name : avg
 *          required : true
 *          description : 인상률
 *          schema:
 *            type : int
 *      responses:
 *        "200":
 *          description: 특정 부서의 급여를 특정 비율로 인상 및 사원 정보 업데이트 
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 */
app.get('/payupdate/:name/:avg', (req, res) => {
  //특정 부서의 급여를 특정 비율로 인상 및 사원정보 업데이트
  let { name, avg } = req.params;
  let sql = `update employees a join jobs b on a.job_id=b.job_id
  set a.salary = (case when (a.salary + ROUND( (a.salary /  100) * ?)) >= b.max_salary then b.max_salary else (a.salary + ROUND( (a.salary /  100) * ?)) end)
  where a.department_id in (select department_id from departments where department_name=?);`;
  res.header("Access-Control-Allow-Origin" , "*")
  conn.query(sql, [avg, avg, name], (error, rows, fields) => {
    if (error) throw error;
    console.log('payupdate: ', rows);
    let target = rows.changedRows;
    res.json({result: true, message: `${target}명의 급여가 변경되었습니다.`});
  });
})

/**
 * @swagger
 * paths:
 *  /TsunamiShelter/{page}:
 *    get:
 *      summary: "공공 데이터 포털( www.data.go.kr ) API "
 *      description: "지진해일 관련 긴급대피장소에 대한 시도명, 시군구명, 대피지구명, 위/경도 값을 제공하는 지진해일 긴급대피 장소 서비스"
 *      tags: [ETC]
 *      parameters:
 *        - in : path
 *          name : page
 *          required : true
 *          description : 페이지번호
 *          schema:
 *            type : int
 *      responses:
 *        "200":
 *          description: 지진해일 관련 긴급대피장소에 대한 시도명, 시군구명, 대피지구명, 위/경도 값을 제공하는 지진해일 긴급대피 장소
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 */
app.get('/TsunamiShelter/:page', (req, res) => {
  //지진해일 관련 긴급대피장소에 대한 시도명, 시군구명, 대피지구명, 위/경도 값을 제공하는 지진해일 긴급대피 장소 서비스
  let { page } = req.params;
  const options = {
    uri: "http://api.data.go.kr/openapi/tn_pubr_public_shelter_api",
    qs:{
      serviceKey:"인증키",
      pageNo: page,
      numOfRows	: 10,
      type: "json"
    }
  };
  request.get(options, function (error, response, body) {
    res.header("Access-Control-Allow-Origin" , "*")
    res.send(body)
  });
  
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})