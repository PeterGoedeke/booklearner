import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import prisma from '../models/db'
import asyncHandler from 'express-async-handler'

type Post = (req: Request<{}, {}, Paths.Examples.Post.RequestBody>, res: Response) => void

const postInner: Post = async (req, res) => {
    const example = await prisma.example.create({
        data: {
            name: req.body.name
        }
    })
    return res.status(StatusCodes.OK).json(example)
}
export const post = asyncHandler(postInner)

type Get = (
    req: Request<{}, {}, {}, Paths.Examples.Get.QueryParameters>,
    res: Response<
        Paths.Examples.Get.Responses.$200 |
        Paths.Examples.Get.Responses.$400 |
        Paths.Examples.Get.Responses.$404
    >
) => void

const getInner: Get = async (req, res) => {
    if (req.query.limit && req.query.limit > 5) {
        throw Error('test')
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Unacceptable' })
    }
    const examples = await prisma.example.findMany()
    return res.status(StatusCodes.OK).json(examples)
}
export const get = asyncHandler(getInner)