import express from "express";
import auth from "../middleware/auth.js";
import prisma from "../database/prisma.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Spendings
 *     description: Operações relacionadas a gastos
 */

/**
 * @swagger
 * /spending/{userId}:
 *   get:
 *     tags:
 *       - Spendings
 *     summary: Obtém a lista de gastos de um usuário
 *     description: Retorna todos os gastos relacionados a um usuário específico, identificado pelo seu ID.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Lista de gastos obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Lista de gastos obtidas com sucesso!
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       day:
 *                         type: string
 *                         format: date
 *                       value:
 *                         type: number
 *                         format: float
 *                       userId:
 *                         type: integer
 *       400:
 *         description: ID do usuário inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ID do usuário inválido
 *     security:
 *       - BearerAuth: []
 */
router.get("/spending/:userId", auth, async (req, res) => {
    if(!isNaN(req.params.userId)){
        let userId = parseInt(req.params.userId);
        
        const spendings = await prisma.spending.findMany({where: { userId: userId }})

        res.statusCode = 200
        res.send({
            message: "Lista de gastos obtidas com sucesso!",
            data: spendings
        })
    }else{
        res.sendStatus(400);
    }
})

/**
 * @swagger
 * /spending:
 *   post:
 *     tags:
 *       - Spendings
 *     summary: Cria um novo gasto
 *     description: Adiciona um novo gasto relacionado a um usuário específico.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - day
 *               - value
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID do usuário ao qual o gasto pertence
 *               name:
 *                 type: string
 *                 description: Nome para identificar o gasto
 *               day:
 *                 type: string
 *                 description: >
 *                   Dia do gasto. Deve estar no formato ISO 8601, por exemplo: "2024-09-03T12:34:56Z"
 *                 example: "2024-09-03T12:34:56Z"
 *               value:
 *                 type: number
 *                 format: float
 *                 description: Valor do gasto
 *     responses:
 *       201:
 *         description: Gasto cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Gasto cadastrado com sucesso!
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *       400:
 *         description: Erro ao cadastrar gasto (dados inválidos)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Um gasto deve estar relacionado a um usuário!
 *     security:
 *       - BearerAuth: []
 */
router.post("/spending", auth, async (req, res) => {
    try {
        let newSpending = req.body;

        if(!newSpending.userId || newSpending.userId == 0) throw Error("Um gasto deve estar relacionado a um usuário!");
        if(!newSpending.day || newSpending.day == "") throw Error("Dia é obrigatório!");
        if(!newSpending.value || newSpending.value == 0) throw Error("Valor é obrigatório!");

        // Parsing the date
        const date = new Date(newSpending.day);
        if (isNaN(date.getTime())) {
            throw Error("Formato de data inválido!");
        }

        const spending = await prisma.spending.create({
            data: {
                name: newSpending.name,
                day: date,
                value: newSpending.value,
                userId: newSpending.userId
            }
        })

        res.status(201).send({
            message: "Gasto cadastrado com sucesso!",
            data: {
                id: spending.id
            }
        });
        
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

/**
 * @swagger
 * /spending/{id}:
 *   put:
 *     tags:
 *       - Spendings
 *     summary: Atualiza um gasto existente
 *     description: Atualiza um gasto relacionado a um usuário específico, identificado pelo ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do gasto a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - day
 *               - value
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID do usuário ao qual o gasto pertence
 *               name:
 *                 type: string
 *                 description: Nome para identificar o gasto
 *               day:
 *                 type: string
 *                 description: >
 *                   Dia do gasto. Deve estar no formato ISO 8601, por exemplo: "2024-09-03T12:34:56Z"
 *                 example: "2024-09-03T12:34:56Z"
 *               value:
 *                 type: number
 *                 format: float
 *                 description: Valor atualizado do gasto
 *     responses:
 *       204:
 *         description: Gasto atualizado com sucesso
 *       400:
 *         description: Dados inválidos fornecidos
 *       404:
 *         description: Gasto não encontrado
 *     security:
 *       - BearerAuth: []
 */
router.put("/spending/:id", auth, async (req, res) => {
    try {
        if(!isNaN(req.params.id)){
            let spendingID = parseInt(req.params.id);
            let updateSpending = req.body;

            // Validação dos dados
            if(!spendingID || spendingID == 0) throw Error("ID de gasto inválido!");
            if(!updateSpending.userId || updateSpending.userId == 0) throw Error("Um gasto deve estar relacionado a um usuário!");
            if(!updateSpending.day || updateSpending.day == "") throw Error("Dia é obrigatório!");
            if(!updateSpending.value || updateSpending.value == 0) throw Error("Valor é obrigatório!"); // Corrigido para 'value' em vez de 'password'

            // Conversão da data
            const date = new Date(updateSpending.day);
            if (isNaN(date.getTime())) {
                throw Error("Formato de data inválido!");
            }

            // Verifica se o gasto existe no banco de dados
            const spendingExist = await prisma.spending.findUnique({ where: { id: spendingID } });
            if (spendingExist == null) {
                res.statusCode = 404;
                res.send({ error: "Gasto não encontrado!" });
            } else {
                // Atualização do gasto
                const spending = await prisma.spending.update({
                    where: { id: spendingID },
                    data: {
                        name: updateSpending.name,
                        day: date,
                        value: updateSpending.value,
                        userId: updateSpending.userId
                    }
                });
        
                res.statusCode = 204;
                res.send({
                    message: "Gasto atualizado com sucesso!",
                    data: {
                        id: spending.id
                    }
                });
            }
        } else {
            res.sendStatus(400);
            res.send({ error: "Id inválido" });
        }
    } catch (error) {
        res.statusCode = 400;
        res.send({ error: error.message });
    }
});

/**
 * @swagger
 * /spending/{id}:
 *   delete:
 *     tags:
 *       - Spendings
 *     summary: Deleta um gasto
 *     description: Remove um gasto identificado pelo ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do gasto a ser deletado
 *     responses:
 *       204:
 *         description: Gasto deletado com sucesso
 *       400:
 *         description: ID de gasto inválido
 *       404:
 *         description: Gasto não encontrado
 *     security:
 *       - BearerAuth: []
 */
router.delete("/spending/:id", async (req, res) => {
    try {
        if(!isNaN(req.params.id)){
            let spendingID = parseInt(req.params.id);
            if(!spendingID || spendingID == 0) throw Error("ID de gasto inválido!");

            const spendingExist = await prisma.spending.findUnique({where: {id: spendingID}});
            if(spendingExist == null) {
                res.statusCode = 404;
                res.send({error: "Gasto não encontrado!"})
            } else {
                const spending = await prisma.spending.delete({where: {id: spendingID}});
                res.statusCode = 204;
                res.send({
                    message: "Gasto atualizado com sucesso!",
                    data: {
                        id: spending.id
                    }
                });
            }
        } else{
            res.sendStatus(400);
        }
    } catch (error) {
        res.statusCode = 400;
        res.send({error: error.message});
    }
})

export default router;