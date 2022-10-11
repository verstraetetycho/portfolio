import 'reflect-metadata'
import { Field, ID, ObjectType } from 'type-graphql'

@ObjectType()
export class Project {
  @Field(() => ID)
  id: string

  @Field(() => String)
  title: string

  @Field(() => String)
  description: string

  @Field(() => Date, { nullable: true })
  date: Date | null

  @Field(() => String, { nullable: true })
  previewUrl: string | null

  @Field(() => String, { nullable: true })
  codeUrl: string | null
}
