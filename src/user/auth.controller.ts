import { Controller, Get, Post, Body } from "@nestjs/common";
import { ApiResponse, ApiBearerAuth, ApiUseTags } from "@nestjs/swagger";
import * as jwt from "jsonwebtoken";

import {
  AuthLoginRequestDto,
  AuthRegisterRequestDto,
  AuthGetSelfMetaResponseDto,
  AuthLoginResponseDto,
  AuthLoginResponseError,
  AuthRegisterResponseDto,
  AuthRegisterResponseError
} from "./dto";
import { ConfigService } from "@/config/config.service";
import { AuthService } from "./auth.service";
import { CurrentUser } from "@/common/user.decorator";
import { UserEntity } from "./user.entity";

@ApiUseTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {}

  @Get("getSelfMeta")
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: AuthGetSelfMetaResponseDto,
    description: "Get the metadata of the current logged-in user"
  })
  async getSelfMeta(
    @CurrentUser() currentUser: UserEntity
  ): Promise<AuthGetSelfMetaResponseDto> {
    const result: AuthGetSelfMetaResponseDto = new AuthGetSelfMetaResponseDto();
    if (currentUser) {
      result.userMeta = {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        bio: currentUser.bio,
        isAdmin: currentUser.isAdmin
      };
    } else {
      result.userMeta = null;
    }

    return result;
  }

  @Post("login")
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: AuthLoginResponseDto,
    description:
      "Login, return the logged-in user's metadata and token if success"
  })
  async login(
    @CurrentUser() currentUser: UserEntity,
    @Body() request: AuthLoginRequestDto
  ): Promise<AuthLoginResponseDto> {
    if (currentUser)
      return {
        error: AuthLoginResponseError.ALREADY_LOGGEDIN
      };

    const [error, user] = await this.authService.login(
      request.username,
      request.password
    );

    if (error)
      return {
        error: error
      };

    return {
      userMeta: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        isAdmin: user.isAdmin
      },
      token: jwt.sign(
        user.id.toString(),
        this.configService.config.security.sessionSecret
      )
    };
  }

  @Post("logout")
  @ApiBearerAuth()
  async logout(): Promise<object> {
    return {};
  }

  @Post("register")
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: AuthRegisterResponseDto,
    description:
      "Register then login, return the new user's metadata and token if success"
  })
  async register(
    @CurrentUser() currentUser: UserEntity,
    @Body() request: AuthRegisterRequestDto
  ): Promise<AuthRegisterResponseDto> {
    if (currentUser)
      return {
        error: AuthRegisterResponseError.ALREADY_LOGGEDIN
      };

    const [error, user] = await this.authService.register(
      request.username,
      request.email,
      request.password
    );

    if (error)
      return {
        error: error
      };

    return {
      userMeta: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        isAdmin: user.isAdmin
      },
      token: jwt.sign(
        user.id.toString(),
        this.configService.config.security.sessionSecret
      )
    };
  }
}
