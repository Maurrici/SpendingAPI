import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import JWTsecret from "../middleware/JWTsecret.js";
import prisma from "../database/prisma.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Operações relacionadas a usuários
 */

/**
 * @swagger
 * /user:
 *   post:
 *     tags:
 *       - Users
 *     summary: Cria um novo usuário
 *     description: Cria um novo usuário com nome, email e senha. A senha é criptografada antes de ser armazenada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 example: joao.silva@example.com
 *               password:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuário cadastrado com sucesso!
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Erro ao cadastrar usuário (nome, email ou senha inválidos)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Nome é obrigatório!
 */
router.post("/user", async (req, res) => {
    try {
        let newUser = req.body;

        if(!newUser.name || newUser.name == "") throw Error("Nome é obrigatório!");
        if(!newUser.email || newUser.email == "") throw Error("Email é obrigatório!");
        if(!newUser.password || newUser.password == "") throw Error("Senha é obrigatória!");

        const existUser = prisma.user.findUnique({
            where: {
                email: newUser.email
            }
        });

        if(existUser != null) {
            let salt = bcrypt.genSaltSync(10);
            let hash = bcrypt.hashSync(newUser.password, salt);

            const user = await prisma.user.create({
                data: {
                    name: newUser.name,
                    email: newUser.email,
                    password: hash
                }
            });

            res.statusCode = 201;
            res.send({
                message: "Usuário cadastrado com sucesso!",
                data: {
                    id: user.id
                }
            });
        } else {
            res.statusCode = 400;
            res.send({error: "Email já"});
        }
    } catch (error) {
        res.statusCode = 400;
        res.send({error: error.message});
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *       - Users
 *     summary: Realiza login de um usuário
 *     description: Realiza o login de um usuário com email e senha, retornando um token JWT se bem-sucedido.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: joao.silva@example.com
 *               password:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login efetuado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login efetuado com sucesso!
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: int
 *                       example: 123
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Email ou senha inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email ou senha inválidos
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Usuário não encontrado!
 */
router.post("/login", async (req, res) => {
    try {
        let userLogin = req.body;

        if(!userLogin.email || userLogin.email == "" || !userLogin.password || userLogin.password == "") throw Error("Email ou senha inválidos");
        
        const user = await prisma.user.findUnique({where: {email: userLogin.email}})
        
        if(user != null) {
            let isCorrectPassword = bcrypt.compareSync(userLogin.password, user.password)
            
            if(!isCorrectPassword) throw Error("Email ou senha incorretos!");
            
            jwt.sign({id: user.id, email: user.email}, JWTsecret, {expiresIn: '15d'}, (err, token) => {
                if(err) res.sendStatus(500);
                else {
                    res.statusCode = 200;
                    res.json({message: "Login efetuado com sucesso!", data: {
                        userId: user.id,
                        token
                    }})
                }
            })
        } else {
            res.statusCode = 404
            res.send({error: "Usuário não encontrado!"});
        }
    } catch (error) {
        res.statusCode = 400;
        res.send({error: error.message});
    }
});

export default router;
