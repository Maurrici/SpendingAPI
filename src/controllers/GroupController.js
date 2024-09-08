import express from "express";
import auth from "../middleware/auth.js";
import prisma from "../database/prisma.js";
import bcrypt from "bcryptjs"

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Group
 *     description: Operações relacionadas a grupos de usuários
 */

/**
 * @swagger
 * /group:
 *   get:
 *     tags:
 *       - Group
 *     summary: Obtém todos os grupos
 *     description: Retorna uma lista de todos os grupos disponíveis.
 *     responses:
 *       200:
 *         description: Lista de grupos obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: ID do grupo
 *                         example: 1
 *                       name:
 *                         type: string
 *                         description: Nome do grupo
 *                         example: "Meu Grupo"
 *                       users:
 *                         type: array
 *                         description: Lista de usuários do grupo
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               description: ID do usuário
 *                               example: 1
 *                             name:
 *                               type: string
 *                               description: Nome do usuário
 *                               example: "John Doe"
 *                             email:
 *                               type: string
 *                               description: Email do usuário
 *                               example: "john.doe@email.com"
 *                             spendings:
 *                               type: array
 *                               description: Lista de gastos do usuário
 *                               items:
 *                                 type: object
 *       400:
 *         description: Erro ao obter a lista de grupos
 *     security:
 *       - BearerAuth: []
 */
router.get("/group", auth, async (req, res) => {
    try {
        const groups = await prisma.group.findMany({
            select: {id: true, name: true, users: { 
                select: { id: true, name: true, email: true, spendings: true }
            }}
        });

        res.send({
            message: "Grupos obtido com sucesso!",
            data: groups
        })
    } catch (error) {
        res.statusCode = 400;
        res.send({error: error.message});
    }
})

/**
 * @swagger
 * /group/{id}:
 *   get:
 *     tags:
 *       - Group
 *     summary: Obtém um grupo específico pelo ID
 *     description: Retorna as informações de um grupo identificado pelo ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do grupo
 *     responses:
 *       200:
 *         description: Grupo obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID do grupo
 *                       example: 1
 *                     name:
 *                       type: string
 *                       description: Nome do grupo
 *                       example: "Meu Grupo"
 *                     users:
 *                       type: array
 *                       description: Lista de usuários do grupo
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: ID do usuário
 *                             example: 1
 *                           name:
 *                             type: string
 *                             description: Nome do usuário
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             description: Email do usuário
 *                             example: "john.doe@email.com"
 *                           spendings:
 *                             type: array
 *                             description: Lista de gastos do usuário
 *                             items:
 *                               type: object
 *       400:
 *         description: ID inválido fornecido
 *       404:
 *         description: Grupo não encontrado
 *     security:
 *       - BearerAuth: []
 */
router.get("/group/:id", auth, async (req, res) => {
    try {
        if(!isNaN(req.params.id)){
            let groupID = parseInt(req.params.id);

            const group = await prisma.group.findMany({
                where: {id: groupID},
                select: {id: true, name: true, users: { 
                    select: { id: true, name: true, email: true, spendings: true }
                }}
            });

            res.send({
                message: "Grupo obtido com sucesso!",
                data: group
            })
        } else {
            res.sendStatus(400);
        }
    } catch (error) {
        res.statusCode = 400;
        res.send({error: error.message});
    }
})

/**
 * @swagger
 * /group:
 *   post:
 *     tags:
 *       - Group
 *     summary: Cria um novo grupo
 *     description: Cria um novo grupo com um nome e uma senha, associando-o a um usuário.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *               - password
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID do usuário que cria o grupo
 *               name:
 *                 type: string
 *                 description: Nome do grupo
 *               password:
 *                 type: string
 *                 description: Senha do grupo
 *     responses:
 *       201:
 *         description: Grupo criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *       400:
 *         description: Erro ao criar o grupo
 *     security:
 *       - BearerAuth: []
 */
router.post("/group", auth, async (req, res) => {
    try {
        const newGroup = req.body;

        if(!newGroup.userId || newGroup.userId == 0) throw Error("É necessário um usuário para criar o grupo!");
        if(!newGroup.name || newGroup.name == "") throw Error("Nome é obrigatório!");
        if(!newGroup.password || newGroup.password == "") throw Error("Senha é obrigatória");

        const existGroup = await prisma.group.findUnique({where: {name: newGroup.name}});

        if(existGroup == null) {
            let salt = bcrypt.genSaltSync(10);
            let hash = bcrypt.hashSync(newGroup.password, salt);

            const group = await prisma.group.create({
                data: {
                    name: newGroup.name,
                    password: hash
                }
            }) 

            const user = await prisma.user.update({
                where: {id: group.id},
                data: {
                    groupId: group.id
                }
            })

            res.statusCode = 201;
            res.send({
                message: "Grupo cadastrado com sucesso!",
                data: {
                    id: group.id
                }
            });
        } else {
            throw Error("Já existe um grupo com esse nome!");
        }
    } catch (error) {
        res.statusCode = 400;
        res.send({error: error.message});
    }
})

/**
 * @swagger
 * /group/join:
 *   post:
 *     tags:
 *       - Group
 *     summary: Entrar em um grupo existente
 *     description: O usuário entra em um grupo fornecendo o ID e a senha do grupo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - groupId
 *               - password
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID do usuário
 *               groupId:
 *                 type: integer
 *                 description: ID do grupo
 *               password:
 *                 type: string
 *                 description: Senha do grupo
 *     responses:
 *       201:
 *         description: Usuário adicionado com sucesso ao grupo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *       400:
 *         description: Erro ao adicionar o usuário ao grupo
 *     security:
 *       - BearerAuth: []
 */
router.post("/group/join", auth, async (req, res) => {
    try {
        const groupJoin = req.body;

        if(!groupJoin.userId || groupJoin.userId == 0) throw Error("É necessário um usuário para criar o grupo!");
        if(!groupJoin.groupId || groupJoin.groupId == 0) throw Error("É necessário um usuário para criar o grupo!");
        if(!groupJoin.password || groupJoin.password == "") throw Error("Senha é obrigatória!");

        const group = await prisma.group.findUnique({where: {id: groupJoin.groupId}});

        if(group != null) {
            let isCorrectPassword = bcrypt.compareSync(groupJoin.password, group.password)

            if(isCorrectPassword) {
                const user = await prisma.user.update({
                    where: {id: groupJoin.userId},
                    data: {
                        groupId: groupJoin.groupId
                    }
                })
    
                res.statusCode = 201;
                res.send({
                    message: "Usuário adicionado com sucesso!",
                    data: {
                        id: user.id
                    }
                });
            } else {
                throw Error("Senha incorreta!");
            }
        } else {
            throw Error("Já existe um grupo com esse nome!");
        }
    } catch (error) {
        res.statusCode = 400;
        res.send({error: error.message});
    }
})

/**
 * @swagger
 * /group/leave:
 *   post:
 *     tags:
 *       - Group
 *     summary: Sair de um grupo existente
 *     description: O usuário sai de um grupo removendo a associação ao ID do grupo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - groupId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID do usuário
 *               groupId:
 *                 type: integer
 *                 description: ID do grupo
 *     responses:
 *       201:
 *         description: Usuário removido do grupo com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *       400:
 *         description: Erro ao remover o usuário do grupo
 *     security:
 *       - BearerAuth: []
 */
router.post("/group/leave", auth, async (req, res) => {
    try {
        const groupJoin = req.body;

        if(!groupJoin.userId || groupJoin.userId == 0) throw Error("É necessário um usuário para criar o grupo!");
        if(!groupJoin.groupId || groupJoin.groupId == 0) throw Error("É necessário um usuário para criar o grupo!");

        const group = await prisma.group.findUnique({where: {id: groupJoin.groupId}});

        if(group != null) {
            const user = await prisma.user.update({
                where: {id: groupJoin.userId},
                data: {
                    groupId: null
                }
            })

            res.statusCode = 201;
            res.send({
                message: "Usuário removido com sucesso!",
                data: {
                    id: user.id
                }
            });
        } else {
            res.statusCode = 400;
            res.send({error: "Grupo não encontrado!"});
        }
    } catch (error) {
        res.statusCode = 400;
        res.send({error: error.message});
    }
})

export default router;